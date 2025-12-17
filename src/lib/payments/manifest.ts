import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Manifest Financial Integration
 * Handles payment processing, subscriptions, and payouts for TrueFans RADIO
 *
 * Integration Docs: https://manifest.fin/docs
 */

export interface ManifestCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, any>;
}

export interface ManifestSubscription {
  id: string;
  customerId: string;
  planId: string;
  status: "active" | "cancelled" | "past_due" | "unpaid";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  amount: number;
  metadata?: Record<string, any>;
}

export interface ManifestPaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: "succeeded" | "processing" | "failed";
  customerId?: string;
  metadata?: Record<string, any>;
}

export interface ManifestPayout {
  id: string;
  amount: number;
  destination: string; // Bank account or external account ID
  status: "pending" | "in_transit" | "paid" | "failed";
  metadata?: Record<string, any>;
}

class ManifestFinancial {
  private apiKey: string | undefined;
  private baseUrl = "https://api.manifest.fin/v1";

  constructor() {
    this.apiKey = env.MANIFEST_API_KEY;

    if (!this.apiKey) {
      logger.warn("Manifest API key not configured - payment features will not work");
    }
  }

  /**
   * Check if Manifest is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Make an API request to Manifest
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error("Manifest API key not configured");
    }

    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Unknown error" }));
      logger.error("Manifest API error", {
        endpoint,
        status: response.status,
        error,
      });
      throw new Error(`Manifest API error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a customer in Manifest
   */
  async createCustomer(params: {
    email: string;
    name?: string;
    metadata?: Record<string, any>;
  }): Promise<ManifestCustomer> {
    logger.info("Creating Manifest customer", { email: params.email });

    const customer = await this.request<ManifestCustomer>("/customers", {
      method: "POST",
      body: JSON.stringify(params),
    });

    logger.info("Manifest customer created", { customerId: customer.id });

    return customer;
  }

  /**
   * Create an airplay subscription for an artist
   */
  async createAirplaySubscription(params: {
    artistId: string;
    tier: "TIER_5" | "TIER_20" | "TIER_50" | "TIER_120";
    email: string;
    name: string;
  }): Promise<{ subscriptionId: string; checkoutUrl: string }> {
    const tierPricing = {
      TIER_5: { amount: 500, name: "$5/month - 5 shares" },
      TIER_20: { amount: 2000, name: "$20/month - 25 shares" },
      TIER_50: { amount: 5000, name: "$50/month - 75 shares" },
      TIER_120: { amount: 12000, name: "$120/month - 200 shares" },
    };

    const pricing = tierPricing[params.tier];

    logger.info("Creating airplay subscription", {
      artistId: params.artistId,
      tier: params.tier,
    });

    // Create customer if needed
    const customer = await this.createCustomer({
      email: params.email,
      name: params.name,
      metadata: {
        artistId: params.artistId,
        type: "artist",
      },
    });

    // Create subscription
    const subscription = await this.request<ManifestSubscription>("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        customerId: customer.id,
        planId: `airplay_${params.tier.toLowerCase()}`,
        amount: pricing.amount,
        currency: "usd",
        interval: "month",
        metadata: {
          artistId: params.artistId,
          tier: params.tier,
          type: "airplay",
        },
      }),
    });

    // Generate checkout URL (Manifest hosted checkout)
    const checkoutUrl = `${this.baseUrl}/checkout/${subscription.id}`;

    logger.info("Airplay subscription created", {
      subscriptionId: subscription.id,
      artistId: params.artistId,
    });

    return {
      subscriptionId: subscription.id,
      checkoutUrl,
    };
  }

  /**
   * Create a sponsorship subscription
   */
  async createSponsorshipSubscription(params: {
    sponsorId: string;
    tier: "bronze" | "silver" | "gold" | "platinum";
    email: string;
    businessName: string;
  }): Promise<{ subscriptionId: string; checkoutUrl: string }> {
    const tierPricing = {
      bronze: { amount: 10000, name: "Bronze - $100/month" },
      silver: { amount: 30000, name: "Silver - $300/month" },
      gold: { amount: 50000, name: "Gold - $500/month" },
      platinum: { amount: 100000, name: "Platinum - $1,000/month" },
    };

    const pricing = tierPricing[params.tier];

    logger.info("Creating sponsorship subscription", {
      sponsorId: params.sponsorId,
      tier: params.tier,
    });

    // Create customer
    const customer = await this.createCustomer({
      email: params.email,
      name: params.businessName,
      metadata: {
        sponsorId: params.sponsorId,
        type: "sponsor",
      },
    });

    // Create subscription
    const subscription = await this.request<ManifestSubscription>("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        customerId: customer.id,
        planId: `sponsor_${params.tier}`,
        amount: pricing.amount,
        currency: "usd",
        interval: "month",
        metadata: {
          sponsorId: params.sponsorId,
          tier: params.tier,
          type: "sponsorship",
        },
      }),
    });

    const checkoutUrl = `${this.baseUrl}/checkout/${subscription.id}`;

    logger.info("Sponsorship subscription created", {
      subscriptionId: subscription.id,
      sponsorId: params.sponsorId,
    });

    return {
      subscriptionId: subscription.id,
      checkoutUrl,
    };
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    logger.info("Cancelling subscription", { subscriptionId });

    await this.request(`/subscriptions/${subscriptionId}`, {
      method: "DELETE",
    });

    logger.info("Subscription cancelled", { subscriptionId });
  }

  /**
   * Create a payout to an artist
   */
  async createArtistPayout(params: {
    artistId: string;
    amount: number;
    bankAccountId: string;
    period: string;
  }): Promise<ManifestPayout> {
    logger.info("Creating artist payout", {
      artistId: params.artistId,
      amount: params.amount,
      period: params.period,
    });

    const payout = await this.request<ManifestPayout>("/payouts", {
      method: "POST",
      body: JSON.stringify({
        amount: Math.round(params.amount * 100), // Convert to cents
        currency: "usd",
        destination: params.bankAccountId,
        metadata: {
          artistId: params.artistId,
          period: params.period,
          type: "radio_earnings",
        },
      }),
    });

    logger.info("Artist payout created", {
      payoutId: payout.id,
      artistId: params.artistId,
    });

    return payout;
  }

  /**
   * Retrieve subscription details
   */
  async getSubscription(subscriptionId: string): Promise<ManifestSubscription> {
    return this.request<ManifestSubscription>(`/subscriptions/${subscriptionId}`);
  }

  /**
   * Handle webhook events from Manifest
   */
  async handleWebhook(
    payload: string,
    signature: string
  ): Promise<{
    event: string;
    data: any;
  }> {
    // Verify webhook signature
    const webhookSecret = env.MANIFEST_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("Manifest webhook secret not configured");
    }

    // TODO: Implement signature verification
    // This depends on Manifest's specific webhook signing method

    const event = JSON.parse(payload);

    logger.info("Processing Manifest webhook", {
      eventType: event.type,
    });

    return {
      event: event.type,
      data: event.data,
    };
  }

  /**
   * Process different webhook event types
   */
  async processWebhookEvent(eventType: string, data: any): Promise<void> {
    const { prisma } = await import("@/lib/db");

    switch (eventType) {
      case "subscription.created":
        logger.info("Subscription created", { subscriptionId: data.id });
        break;

      case "subscription.updated":
        logger.info("Subscription updated", { subscriptionId: data.id });

        // Update subscription status in database
        if (data.metadata?.artistId) {
          await prisma.artist.update({
            where: { id: data.metadata.artistId },
            data: {
              airplayTier: data.metadata.tier,
            },
          });
        }
        break;

      case "subscription.cancelled":
        logger.info("Subscription cancelled", { subscriptionId: data.id });

        // Downgrade to FREE tier
        if (data.metadata?.artistId) {
          await prisma.artist.update({
            where: { id: data.metadata.artistId },
            data: {
              airplayTier: "FREE",
              airplayShares: 1,
            },
          });
        }
        break;

      case "payment.succeeded":
        logger.info("Payment succeeded", { paymentId: data.id });
        break;

      case "payment.failed":
        logger.error("Payment failed", { paymentId: data.id });
        break;

      case "payout.paid":
        logger.info("Payout completed", { payoutId: data.id });

        // Update earnings record
        if (data.metadata?.artistId && data.metadata?.period) {
          await prisma.radioEarnings.updateMany({
            where: {
              artistId: data.metadata.artistId,
              period: data.metadata.period,
            },
            data: {
              paid: true,
              paidAt: new Date(),
            },
          });
        }
        break;

      default:
        logger.warn("Unknown webhook event type", { eventType });
    }
  }
}

// Singleton instance
export const manifest = new ManifestFinancial();
