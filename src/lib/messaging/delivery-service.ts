import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Message delivery service for SMS, Email, and Instagram
 * Integrates with GoHighLevel (SMS + Email) and Instagram API
 */

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const STATION_NAME = process.env.NEXT_PUBLIC_STATION_NAME || "North Country Radio";
const TAG_PREFIX = process.env.NEXT_PUBLIC_STATION_CALL_SIGN || "NCR";

export type MessageChannel = "sms" | "email" | "instagram";

export interface DeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  channel: MessageChannel;
}

export interface MessagePayload {
  to: string; // Phone number, email, or Instagram handle
  content: string;
  channel: MessageChannel;
  from?: string; // Optional custom sender
  subject?: string; // Optional subject for email
  artistName?: string; // Used for GHL contact upsert
  pipelineStage?: string; // Current Riley pipeline stage for GHL tagging
}

/** Maps Riley pipeline stages to GHL contact tags */
const RILEY_STAGE_TAGS: Record<string, string> = {
  discovery: "Riley - Discovery",
  contacted: "Riley - Contacted",
  engaged: "Riley - Engaged",
  qualified: "Riley - Qualified",
  onboarding: "Riley - Onboarding",
  activated: "Riley - Activated",
  active: "Riley - Active",
};

/** Maps Cassidy submission stages to GHL contact tags */
const CASSIDY_STAGE_TAGS: Record<string, string> = {
  pending: "Cassidy - Pending",
  in_review: "Cassidy - In Review",
  judged: "Cassidy - Judged",
  placed: "Cassidy - Placed",
  not_placed: "Cassidy - Not Placed",
};

function cassidyPlacedTag(tier: string): string {
  const formatted = tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
  return `Cassidy - Placed - ${formatted}`;
}

/** Maps Harper sponsor stages to GHL contact tags */
const HARPER_STAGE_TAGS: Record<string, string> = {
  discovery: "Harper - Discovery",
  contacted: "Harper - Contacted",
  interested: "Harper - Interested",
  negotiating: "Harper - Negotiating",
  closed: "Harper - Closed",
  active: "Harper - Active",
};

function harperTierTag(tier: string): string {
  const formatted = tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
  return `Harper - ${formatted}`;
}

/** Maps Elliot listener stages to GHL contact tags */
const ELLIOT_STAGE_TAGS: Record<string, string> = {
  new: "Elliot - New",
  engaged: "Elliot - Engaged",
  active: "Elliot - Active",
  at_risk: "Elliot - At Risk",
  power_user: "Elliot - Power User",
};

function elliotTierTag(tier: string): string {
  const map: Record<string, string> = {
    casual: "Elliot - Casual",
    regular: "Elliot - Regular",
    super_fan: "Elliot - Super Fan",
    evangelist: "Elliot - Evangelist",
  };
  return map[tier.toLowerCase()] || `Elliot - ${tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase()}`;
}

class MessageDeliveryService {
  private pipelineStageMap: Record<string, string> | null = null;
  private cassidyPipelineStageMap: Record<string, string> | null = null;
  private harperPipelineStageMap: Record<string, string> | null = null;
  private elliotPipelineStageMap: Record<string, string> | null = null;

  /**
   * Send a message via the specified channel
   */
  async send(payload: MessagePayload): Promise<DeliveryResult> {
    const { channel, to, content, from, subject, artistName, pipelineStage } = payload;

    logger.info("Attempting message delivery", {
      channel,
      to: this.maskSensitiveData(to),
      contentLength: content.length,
    });

    try {
      switch (channel) {
        case "sms":
          return await this.sendSMS(to, content, artistName, pipelineStage);
        case "email":
          return await this.sendEmail(to, content, subject, artistName, pipelineStage);
        case "instagram":
          return await this.sendInstagram(to, content);
        default:
          throw new Error(`Unsupported channel: ${channel}`);
      }
    } catch (error) {
      logger.error("Message delivery failed", {
        channel,
        to: this.maskSensitiveData(to),
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        channel,
      };
    }
  }

  /**
   * Build tags array for a GHL contact based on pipeline stage
   */
  private buildTags(pipelineStage?: string): string[] {
    const tags = [`${TAG_PREFIX} Riley`];
    if (pipelineStage) {
      const stageTag = RILEY_STAGE_TAGS[pipelineStage];
      if (stageTag) tags.push(stageTag);
    }
    return tags;
  }

  /**
   * Upsert a contact in GoHighLevel (required before sending messages)
   */
  private async upsertGHLContact(opts: {
    phone?: string;
    email?: string;
    name?: string;
    tags?: string[];
  }): Promise<string> {
    const res = await fetch(`${GHL_BASE_URL}/contacts/upsert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GHL_API_KEY}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locationId: env.GHL_LOCATION_ID,
        ...opts,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GHL contact upsert failed (${res.status}): ${body}`);
    }

    const data = await res.json();
    return data.contact.id;
  }

  /**
   * Fetch and cache pipeline stage IDs from GHL
   */
  private async fetchPipelineStages(): Promise<Record<string, string>> {
    if (this.pipelineStageMap) return this.pipelineStageMap;

    const res = await fetch(
      `${GHL_BASE_URL}/opportunities/pipelines?locationId=${env.GHL_LOCATION_ID}`,
      {
        headers: {
          Authorization: `Bearer ${env.GHL_API_KEY}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      logger.warn("Failed to fetch GHL pipelines", { status: res.status });
      return {};
    }

    const data = await res.json();
    const pipeline = data.pipelines?.find(
      (p: any) => p.id === env.GHL_RILEY_PIPELINE_ID
    );

    if (!pipeline) {
      logger.warn("Riley pipeline not found in GHL", {
        pipelineId: env.GHL_RILEY_PIPELINE_ID,
      });
      return {};
    }

    this.pipelineStageMap = {};
    for (const s of pipeline.stages) {
      this.pipelineStageMap[s.name.toLowerCase()] = s.id;
    }

    logger.info("Cached GHL pipeline stages", {
      stages: Object.keys(this.pipelineStageMap),
    });

    return this.pipelineStageMap;
  }

  /**
   * Upsert an opportunity in the Riley pipeline (create or move to new stage)
   */
  private async upsertGHLOpportunity(
    contactId: string,
    stage: string,
    artistName: string
  ): Promise<void> {
    const stageMap = await this.fetchPipelineStages();
    const stageId = stageMap[stage.toLowerCase()];
    if (!stageId) {
      logger.warn("GHL pipeline stage not found", { stage, availableStages: Object.keys(stageMap) });
      return;
    }

    const res = await fetch(`${GHL_BASE_URL}/opportunities/upsert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GHL_API_KEY}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pipelineId: env.GHL_RILEY_PIPELINE_ID,
        pipelineStageId: stageId,
        locationId: env.GHL_LOCATION_ID,
        contactId,
        name: `${artistName} - Riley Pipeline`,
        status: "open",
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.warn("GHL opportunity upsert failed", { status: res.status, body });
    } else {
      logger.info("GHL opportunity synced", { contactId, stage, artistName });
    }
  }

  /**
   * Sync an artist's pipeline stage to GHL (tags contact + moves opportunity)
   * Called from riley-agent when a stage transition occurs.
   */
  async syncArtistStage(opts: {
    phone?: string;
    email?: string;
    name?: string;
    stage: string;
  }): Promise<void> {
    if (!env.GHL_API_KEY || !env.GHL_LOCATION_ID) return;

    try {
      const tags = this.buildTags(opts.stage);

      const contactId = await this.upsertGHLContact({
        phone: opts.phone,
        email: opts.email,
        name: opts.name,
        tags,
      });

      // Move opportunity through pipeline if configured
      if (env.GHL_RILEY_PIPELINE_ID) {
        await this.upsertGHLOpportunity(
          contactId,
          opts.stage,
          opts.name || "Unknown Artist"
        );
      }
    } catch (error) {
      // Don't let GHL sync failures break the Riley flow
      logger.warn("Failed to sync artist stage to GHL", {
        stage: opts.stage,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Build tags array for a GHL contact based on Cassidy submission stage
   */
  private buildCassidyTags(stage: string, tier?: string): string[] {
    const tags = [`${TAG_PREFIX} Cassidy`];
    const stageTag = CASSIDY_STAGE_TAGS[stage];
    if (stageTag) tags.push(stageTag);
    if (tier && stage === "placed") {
      tags.push(cassidyPlacedTag(tier));
    }
    return tags;
  }

  /**
   * Fetch and cache Cassidy pipeline stage IDs from GHL
   */
  private async fetchCassidyPipelineStages(): Promise<Record<string, string>> {
    if (this.cassidyPipelineStageMap) return this.cassidyPipelineStageMap;

    const res = await fetch(
      `${GHL_BASE_URL}/opportunities/pipelines?locationId=${env.GHL_LOCATION_ID}`,
      {
        headers: {
          Authorization: `Bearer ${env.GHL_API_KEY}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      logger.warn("Failed to fetch GHL pipelines for Cassidy", { status: res.status });
      return {};
    }

    const data = await res.json();
    const pipeline = data.pipelines?.find(
      (p: any) => p.id === env.GHL_CASSIDY_PIPELINE_ID
    );

    if (!pipeline) {
      logger.warn("Cassidy pipeline not found in GHL", {
        pipelineId: env.GHL_CASSIDY_PIPELINE_ID,
      });
      return {};
    }

    this.cassidyPipelineStageMap = {};
    for (const s of pipeline.stages) {
      this.cassidyPipelineStageMap[s.name.toLowerCase().replace(/ /g, "_")] = s.id;
    }

    logger.info("Cached GHL Cassidy pipeline stages", {
      stages: Object.keys(this.cassidyPipelineStageMap),
    });

    return this.cassidyPipelineStageMap;
  }

  /**
   * Upsert an opportunity in the Cassidy pipeline (create or move to new stage)
   */
  private async upsertCassidyOpportunity(
    contactId: string,
    stage: string,
    artistName: string,
    trackTitle: string
  ): Promise<void> {
    const stageMap = await this.fetchCassidyPipelineStages();
    const stageId = stageMap[stage.toLowerCase()];
    if (!stageId) {
      logger.warn("GHL Cassidy pipeline stage not found", { stage, availableStages: Object.keys(stageMap) });
      return;
    }

    const res = await fetch(`${GHL_BASE_URL}/opportunities/upsert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GHL_API_KEY}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pipelineId: env.GHL_CASSIDY_PIPELINE_ID,
        pipelineStageId: stageId,
        locationId: env.GHL_LOCATION_ID,
        contactId,
        name: `${artistName} - ${trackTitle}`,
        status: "open",
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.warn("GHL Cassidy opportunity upsert failed", { status: res.status, body });
    } else {
      logger.info("GHL Cassidy opportunity synced", { contactId, stage, artistName, trackTitle });
    }
  }

  /**
   * Sync a submission's stage to GHL (tags contact + moves Cassidy opportunity)
   * Called from Cassidy routes when a submission status transition occurs.
   */
  async syncCassidyStage(opts: {
    phone?: string;
    email?: string;
    name: string;
    trackTitle: string;
    stage: string;
    tier?: string;
  }): Promise<void> {
    if (!env.GHL_API_KEY || !env.GHL_LOCATION_ID) return;

    try {
      const tags = this.buildCassidyTags(opts.stage, opts.tier);

      const contactId = await this.upsertGHLContact({
        phone: opts.phone,
        email: opts.email,
        name: opts.name,
        tags,
      });

      if (env.GHL_CASSIDY_PIPELINE_ID) {
        await this.upsertCassidyOpportunity(
          contactId,
          opts.stage,
          opts.name,
          opts.trackTitle
        );
      }
    } catch (error) {
      logger.warn("Failed to sync Cassidy stage to GHL", {
        stage: opts.stage,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ── Harper Pipeline Methods ──

  /**
   * Build tags array for a GHL contact based on Harper sponsor stage
   */
  private buildHarperTags(stage: string, tier?: string): string[] {
    const tags = [`${TAG_PREFIX} Harper`];
    const stageTag = HARPER_STAGE_TAGS[stage];
    if (stageTag) tags.push(stageTag);
    if (tier) {
      tags.push(harperTierTag(tier));
    }
    return tags;
  }

  /**
   * Fetch and cache Harper pipeline stage IDs from GHL
   */
  private async fetchHarperPipelineStages(): Promise<Record<string, string>> {
    if (this.harperPipelineStageMap) return this.harperPipelineStageMap;

    const res = await fetch(
      `${GHL_BASE_URL}/opportunities/pipelines?locationId=${env.GHL_LOCATION_ID}`,
      {
        headers: {
          Authorization: `Bearer ${env.GHL_API_KEY}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      logger.warn("Failed to fetch GHL pipelines for Harper", { status: res.status });
      return {};
    }

    const data = await res.json();
    const pipeline = data.pipelines?.find(
      (p: any) => p.id === env.GHL_HARPER_PIPELINE_ID
    );

    if (!pipeline) {
      logger.warn("Harper pipeline not found in GHL", {
        pipelineId: env.GHL_HARPER_PIPELINE_ID,
      });
      return {};
    }

    this.harperPipelineStageMap = {};
    for (const s of pipeline.stages) {
      this.harperPipelineStageMap[s.name.toLowerCase()] = s.id;
    }

    logger.info("Cached GHL Harper pipeline stages", {
      stages: Object.keys(this.harperPipelineStageMap),
    });

    return this.harperPipelineStageMap;
  }

  /**
   * Upsert an opportunity in the Harper pipeline
   */
  private async upsertHarperOpportunity(
    contactId: string,
    stage: string,
    businessName: string,
    contactName?: string
  ): Promise<void> {
    const stageMap = await this.fetchHarperPipelineStages();
    const stageId = stageMap[stage.toLowerCase()];
    if (!stageId) {
      logger.warn("GHL Harper pipeline stage not found", { stage, availableStages: Object.keys(stageMap) });
      return;
    }

    const oppName = contactName
      ? `${businessName} - ${contactName}`
      : businessName;

    const res = await fetch(`${GHL_BASE_URL}/opportunities/upsert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GHL_API_KEY}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pipelineId: env.GHL_HARPER_PIPELINE_ID,
        pipelineStageId: stageId,
        locationId: env.GHL_LOCATION_ID,
        contactId,
        name: oppName,
        status: "open",
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.warn("GHL Harper opportunity upsert failed", { status: res.status, body });
    } else {
      logger.info("GHL Harper opportunity synced", { contactId, stage, businessName });
    }
  }

  /**
   * Sync a sponsor's pipeline stage to GHL (tags contact + moves Harper opportunity)
   */
  async syncHarperStage(opts: {
    phone?: string;
    email?: string;
    businessName: string;
    contactName?: string;
    stage: string;
    tier?: string;
  }): Promise<void> {
    if (!env.GHL_API_KEY || !env.GHL_LOCATION_ID) return;

    try {
      const tags = this.buildHarperTags(opts.stage, opts.tier);

      const contactId = await this.upsertGHLContact({
        phone: opts.phone,
        email: opts.email,
        name: opts.contactName || opts.businessName,
        tags,
      });

      if (env.GHL_HARPER_PIPELINE_ID) {
        await this.upsertHarperOpportunity(
          contactId,
          opts.stage,
          opts.businessName,
          opts.contactName
        );
      }
    } catch (error) {
      logger.warn("Failed to sync Harper stage to GHL", {
        stage: opts.stage,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ── Elliot Pipeline Methods ──

  /**
   * Build tags array for a GHL contact based on Elliot listener stage
   */
  private buildElliotTags(stage: string, tier?: string): string[] {
    const tags = [`${TAG_PREFIX} Elliot`];
    const stageTag = ELLIOT_STAGE_TAGS[stage];
    if (stageTag) tags.push(stageTag);
    if (tier) {
      tags.push(elliotTierTag(tier));
    }
    return tags;
  }

  /**
   * Fetch and cache Elliot pipeline stage IDs from GHL
   */
  private async fetchElliotPipelineStages(): Promise<Record<string, string>> {
    if (this.elliotPipelineStageMap) return this.elliotPipelineStageMap;

    const res = await fetch(
      `${GHL_BASE_URL}/opportunities/pipelines?locationId=${env.GHL_LOCATION_ID}`,
      {
        headers: {
          Authorization: `Bearer ${env.GHL_API_KEY}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      logger.warn("Failed to fetch GHL pipelines for Elliot", { status: res.status });
      return {};
    }

    const data = await res.json();
    const pipeline = data.pipelines?.find(
      (p: any) => p.id === env.GHL_ELLIOT_PIPELINE_ID
    );

    if (!pipeline) {
      logger.warn("Elliot pipeline not found in GHL", {
        pipelineId: env.GHL_ELLIOT_PIPELINE_ID,
      });
      return {};
    }

    this.elliotPipelineStageMap = {};
    for (const s of pipeline.stages) {
      this.elliotPipelineStageMap[s.name.toLowerCase().replace(/ /g, "_")] = s.id;
    }

    logger.info("Cached GHL Elliot pipeline stages", {
      stages: Object.keys(this.elliotPipelineStageMap),
    });

    return this.elliotPipelineStageMap;
  }

  /**
   * Upsert an opportunity in the Elliot pipeline
   */
  private async upsertElliotOpportunity(
    contactId: string,
    stage: string,
    listenerName: string
  ): Promise<void> {
    const stageMap = await this.fetchElliotPipelineStages();
    const stageId = stageMap[stage.toLowerCase()];
    if (!stageId) {
      logger.warn("GHL Elliot pipeline stage not found", { stage, availableStages: Object.keys(stageMap) });
      return;
    }

    const res = await fetch(`${GHL_BASE_URL}/opportunities/upsert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GHL_API_KEY}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pipelineId: env.GHL_ELLIOT_PIPELINE_ID,
        pipelineStageId: stageId,
        locationId: env.GHL_LOCATION_ID,
        contactId,
        name: listenerName,
        status: "open",
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.warn("GHL Elliot opportunity upsert failed", { status: res.status, body });
    } else {
      logger.info("GHL Elliot opportunity synced", { contactId, stage, listenerName });
    }
  }

  /**
   * Sync a listener's stage to GHL (tags contact + moves Elliot opportunity)
   */
  async syncElliotStage(opts: {
    phone?: string;
    email?: string;
    name: string;
    stage: string;
    tier?: string;
  }): Promise<void> {
    if (!env.GHL_API_KEY || !env.GHL_LOCATION_ID) return;

    try {
      const tags = this.buildElliotTags(opts.stage, opts.tier);

      const contactId = await this.upsertGHLContact({
        phone: opts.phone,
        email: opts.email,
        name: opts.name,
        tags,
      });

      if (env.GHL_ELLIOT_PIPELINE_ID) {
        await this.upsertElliotOpportunity(
          contactId,
          opts.stage,
          opts.name || "Unknown Listener"
        );
      }
    } catch (error) {
      logger.warn("Failed to sync Elliot stage to GHL", {
        stage: opts.stage,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Send SMS via GoHighLevel
   */
  private async sendSMS(
    to: string,
    content: string,
    name?: string,
    pipelineStage?: string
  ): Promise<DeliveryResult> {
    if (!env.GHL_API_KEY || !env.GHL_LOCATION_ID) {
      logger.warn("GoHighLevel not configured, skipping SMS delivery", { to });
      return {
        success: false,
        error: "GoHighLevel not configured",
        channel: "sms",
      };
    }

    try {
      const tags = this.buildTags(pipelineStage);
      const contactId = await this.upsertGHLContact({ phone: to, name, tags });

      // Sync pipeline opportunity if configured
      if (env.GHL_RILEY_PIPELINE_ID && pipelineStage) {
        await this.upsertGHLOpportunity(contactId, pipelineStage, name || "Unknown Artist");
      }

      const res = await fetch(`${GHL_BASE_URL}/conversations/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GHL_API_KEY}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "SMS",
          contactId,
          message: content,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`GHL SMS send failed (${res.status}): ${body}`);
      }

      const data = await res.json();

      logger.info("SMS sent successfully via GHL", {
        messageId: data.messageId,
        contactId,
        to: this.maskSensitiveData(to),
      });

      return {
        success: true,
        messageId: data.messageId,
        channel: "sms",
      };
    } catch (error) {
      logger.error("GHL SMS delivery failed", {
        to: this.maskSensitiveData(to),
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Send Email via GoHighLevel
   */
  private async sendEmail(
    to: string,
    content: string,
    subject?: string,
    name?: string,
    pipelineStage?: string
  ): Promise<DeliveryResult> {
    if (!env.GHL_API_KEY || !env.GHL_LOCATION_ID) {
      logger.warn("GoHighLevel not configured, skipping email delivery", { to });
      return {
        success: false,
        error: "GoHighLevel not configured",
        channel: "email",
      };
    }

    try {
      const tags = this.buildTags(pipelineStage);
      const contactId = await this.upsertGHLContact({ email: to, name, tags });

      // Sync pipeline opportunity if configured
      if (env.GHL_RILEY_PIPELINE_ID && pipelineStage) {
        await this.upsertGHLOpportunity(contactId, pipelineStage, name || "Unknown Artist");
      }

      const res = await fetch(`${GHL_BASE_URL}/conversations/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GHL_API_KEY}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "Email",
          contactId,
          message: content,
          subject: subject || STATION_NAME,
          html: this.formatEmailHTML(content),
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`GHL email send failed (${res.status}): ${body}`);
      }

      const data = await res.json();

      logger.info("Email sent successfully via GHL", {
        messageId: data.messageId,
        contactId,
        to: this.maskSensitiveData(to),
      });

      return {
        success: true,
        messageId: data.messageId,
        channel: "email",
      };
    } catch (error) {
      logger.error("GHL email delivery failed", {
        to: this.maskSensitiveData(to),
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Send Instagram DM via Graph API
   * Requires: Instagram Business Account + Facebook App with instagram_manage_messages permission
   */
  private async sendInstagram(to: string, content: string): Promise<DeliveryResult> {
    if (!env.INSTAGRAM_ACCESS_TOKEN) {
      logger.warn("Instagram not configured, skipping DM delivery", { to });
      return {
        success: false,
        error: "Instagram access token not configured",
        channel: "instagram",
      };
    }

    try {
      // First, find the Instagram user ID by username
      // The 'to' field should be an Instagram username (without @)
      const username = to.replace(/^@/, "");

      // Use the Instagram Graph API to look up the user's IGSID (Instagram-scoped ID)
      // Note: You can only message users who have messaged your business first (24-hour window)
      // or users who have opted in via ig.me links or CTAs
      const searchRes = await fetch(
        `https://graph.facebook.com/v19.0/me/conversations?platform=instagram&user_id=${encodeURIComponent(username)}&access_token=${env.INSTAGRAM_ACCESS_TOKEN}`
      );

      if (!searchRes.ok) {
        const errorBody = await searchRes.text();
        throw new Error(`Instagram conversation lookup failed (${searchRes.status}): ${errorBody}`);
      }

      const conversations = await searchRes.json();
      const conversationId = conversations.data?.[0]?.id;

      if (!conversationId) {
        // No existing conversation — user hasn't messaged us first
        logger.warn("No Instagram conversation found — user must message the business first", { username });
        return {
          success: false,
          error: "No existing conversation with this user. Instagram requires users to message the business first.",
          channel: "instagram",
        };
      }

      // Send message to existing conversation
      const sendRes = await fetch(
        `https://graph.facebook.com/v19.0/me/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipient: { comment_id: conversationId },
            message: { text: content },
            access_token: env.INSTAGRAM_ACCESS_TOKEN,
          }),
        }
      );

      if (!sendRes.ok) {
        const errorBody = await sendRes.text();
        throw new Error(`Instagram DM send failed (${sendRes.status}): ${errorBody}`);
      }

      const sendData = await sendRes.json();

      logger.info("Instagram DM sent successfully", {
        messageId: sendData.message_id,
        to: this.maskSensitiveData(username),
      });

      return {
        success: true,
        messageId: sendData.message_id,
        channel: "instagram",
      };
    } catch (error) {
      logger.error("Instagram DM delivery failed", {
        to: this.maskSensitiveData(to),
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Format email content as HTML
   */
  private formatEmailHTML(content: string): string {
    // Convert plain text to simple HTML with line breaks
    const htmlContent = content
      .split("\n")
      .map((line) => `<p>${this.escapeHTML(line)}</p>`)
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${STATION_NAME}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #B45309 0%, #EA580C 100%); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${STATION_NAME}</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            ${htmlContent}
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              This message was sent by Riley, your ${STATION_NAME} Artist Acquisition Specialist.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHTML(text: string): string {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Mask sensitive data for logging (phone numbers, emails)
   */
  private maskSensitiveData(data: string): string {
    // Mask email: test@example.com -> t***@e***.com
    if (data.includes("@")) {
      const [local, domain] = data.split("@");
      const maskedLocal = local.charAt(0) + "***";
      const maskedDomain = domain.charAt(0) + "***" + domain.slice(-4);
      return `${maskedLocal}@${maskedDomain}`;
    }

    // Mask phone: +1234567890 -> +123***7890
    if (data.startsWith("+")) {
      return data.slice(0, 4) + "***" + data.slice(-4);
    }

    // Generic masking
    return data.slice(0, 3) + "***" + data.slice(-3);
  }

  /**
   * Validate phone number format (basic validation)
   */
  validatePhoneNumber(phone: string): boolean {
    // E.164 format: +[country code][number]
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export singleton instance
export const messageDelivery = new MessageDeliveryService();
