import { aiProvider, AIMessage } from "./providers";
import {
  HARPER_SYSTEM_PROMPT,
  getHarperPrompt,
  formatConversationHistory,
  HarperIntent,
} from "./harper-personality";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { messageDelivery, MessageChannel } from "@/lib/messaging/delivery-service";

export interface HarperConversationContext {
  sponsorId: string;
  businessName?: string;
  businessType?: string;
  contactName?: string;
  suggestedTier?: string;
  conversationHistory: Array<{ role: string; content: string }>;
  intent: HarperIntent;
}

export class HarperAgent {
  /**
   * Generate Harper's response based on conversation context
   */
  async generateResponse(context: HarperConversationContext): Promise<string> {
    const { businessName, businessType, contactName, suggestedTier, conversationHistory, intent } = context;

    // Build the prompt with Harper's personality + intent-specific instructions
    const intentPrompt = getHarperPrompt(intent, {
      businessName,
      businessType,
      contactName,
      suggestedTier,
      hasRespondedBefore: conversationHistory.length > 0,
    });

    // Format conversation history
    const history = formatConversationHistory(conversationHistory);

    // Build messages for AI
    const messages: AIMessage[] = [
      {
        role: "system",
        content: HARPER_SYSTEM_PROMPT,
      },
      {
        role: "system",
        content: intentPrompt,
      },
      {
        role: "user",
        content: `CONVERSATION HISTORY:\n${history}\n\nGenerate Harper's next message. Remember: Professional, ROI-focused, community-minded. Clear value proposition.`,
      },
    ];

    // Get AI response
    const response = await aiProvider.chat(messages, {
      temperature: 0.7, // Slightly lower for more professional consistency
      maxTokens: 250, // Slightly longer for business communication
    });

    return response.content.trim();
  }

  /**
   * Send a message to a sponsor (stores in DB and triggers delivery)
   */
  async sendMessage(
    sponsorId: string,
    content: string,
    intent: HarperIntent,
    channel: string = "email"
  ): Promise<void> {
    // Get or create conversation
    let conversation = await prisma.sponsorConversation.findFirst({
      where: {
        sponsorId,
        isActive: true,
        channel,
      },
    });

    if (!conversation) {
      conversation = await prisma.sponsorConversation.create({
        data: {
          sponsorId,
          channel,
          isActive: true,
        },
      });
    }

    // Store the message
    const message = await prisma.sponsorMessage.create({
      data: {
        conversationId: conversation.id,
        role: "harper",
        content,
        intent,
      },
    });

    // Get sponsor details for delivery
    const sponsor = await prisma.sponsor.findUnique({
      where: { id: sponsorId },
      select: { email: true, phone: true, businessName: true },
    });

    if (!sponsor) {
      throw new Error(`Sponsor ${sponsorId} not found`);
    }

    // Trigger actual message delivery
    try {
      const deliveryChannel: MessageChannel = channel === "sms" ? "sms" : "email";
      const recipient = channel === "sms" ? sponsor.phone : sponsor.email;

      if (!recipient) {
        throw new Error(`No ${channel} found for sponsor ${sponsorId}`);
      }

      const result = await messageDelivery.send({
        channel: deliveryChannel,
        to: recipient,
        content,
        subject: channel === "email" ? `Partnership Opportunity - ${sponsor.businessName}` : undefined,
      });

      // Note: Delivery status tracking could be added to metadata if needed
      // The SponsorMessage model doesn't have deliveryStatus or externalMessageId fields

      logger.info("Harper message sent", {
        sponsorId,
        messageId: message.id,
        channel,
        intent,
        delivered: result.success,
      });
    } catch (error) {
      logger.error("Failed to deliver Harper message", { error, sponsorId, messageId: message.id });
      // Note: Delivery status could be tracked in metadata if needed
      throw error;
    }

    // Log Harper activity
    await prisma.harperActivity.create({
      data: {
        sponsorId,
        action: "sent_message",
        details: { intent, messageId: message.id, channel },
      },
    });

    // Update sponsor's last contacted timestamp
    await prisma.sponsor.update({
      where: { id: sponsorId },
      data: {
        lastContactedAt: new Date(),
        emailsSent: channel === "email" ? { increment: 1 } : undefined,
        textsSent: channel === "sms" ? { increment: 1 } : undefined,
      },
    });
  }

  /**
   * Handle incoming message from sponsor and generate response
   */
  async handleSponsorMessage(
    sponsorId: string,
    messageContent: string,
    channel: string = "email"
  ): Promise<string> {
    // Get sponsor details
    const sponsor = await prisma.sponsor.findUnique({
      where: { id: sponsorId },
      include: {
        conversations: {
          where: { isActive: true, channel },
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
              take: 20, // Last 20 messages for context
            },
          },
        },
      },
    });

    if (!sponsor) {
      throw new Error(`Sponsor ${sponsorId} not found`);
    }

    // Get or create conversation
    let conversation = sponsor.conversations[0];
    if (!conversation) {
      conversation = await prisma.sponsorConversation.create({
        data: {
          sponsorId,
          channel,
          isActive: true,
        },
        include: { messages: true },
      });
    }

    // Store the sponsor's message
    await prisma.sponsorMessage.create({
      data: {
        conversationId: conversation.id,
        role: "sponsor",
        content: messageContent,
      },
    });

    // Determine intent based on message content and sponsor pipeline stage
    const intent = this.determineIntent(messageContent, sponsor.pipelineStage);

    // Build conversation history
    const conversationHistory = conversation.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add the new sponsor message
    conversationHistory.push({
      role: "sponsor",
      content: messageContent,
    });

    // Generate Harper's response
    const response = await this.generateResponse({
      sponsorId,
      businessName: sponsor.businessName,
      businessType: sponsor.businessType || undefined,
      contactName: sponsor.contactName || undefined,
      suggestedTier: sponsor.sponsorshipTier || "BRONZE",
      conversationHistory,
      intent,
    });

    // Send the response
    await this.sendMessage(sponsorId, response, intent, channel);

    // Update sponsor stage based on intent
    await this.updateSponsorStage(sponsorId, intent);

    return response;
  }

  /**
   * Determine intent from sponsor's message
   */
  private determineIntent(messageContent: string, currentStage: string): HarperIntent {
    const lowerMessage = messageContent.toLowerCase();

    // Check for specific keywords
    if (lowerMessage.includes("interested") || lowerMessage.includes("tell me more")) {
      return "educate_value";
    }

    if (
      lowerMessage.includes("price") ||
      lowerMessage.includes("cost") ||
      lowerMessage.includes("package")
    ) {
      return "pitch_packages";
    }

    if (
      lowerMessage.includes("expensive") ||
      lowerMessage.includes("not sure") ||
      lowerMessage.includes("concern")
    ) {
      return "handle_objection";
    }

    if (lowerMessage.includes("deal") || lowerMessage.includes("contract")) {
      return "negotiate";
    }

    if (lowerMessage.includes("yes") || lowerMessage.includes("let's do it")) {
      return "close_deal";
    }

    if (
      lowerMessage.includes("custom") ||
      lowerMessage.includes("specific") ||
      lowerMessage.includes("unique")
    ) {
      return "hand_to_human";
    }

    // Default based on stage
    if (currentStage === "DISCOVERY" || currentStage === "CONTACTED") {
      return "initial_outreach";
    }

    if (currentStage === "INTERESTED") {
      return "educate_value";
    }

    return "pitch_packages";
  }

  /**
   * Update sponsor's pipeline stage based on intent progression
   */
  private async updateSponsorStage(sponsorId: string, intent: HarperIntent): Promise<void> {
    const stageMap: Record<HarperIntent, string | null> = {
      initial_outreach: "CONTACTED",
      educate_value: "INTERESTED",
      pitch_packages: "INTERESTED",
      handle_objection: null, // Don't change stage
      negotiate: "NEGOTIATING",
      close_deal: "CLOSED",
      hand_to_human: null, // Don't change stage
    };

    const newStage = stageMap[intent];

    if (newStage) {
      await prisma.sponsor.update({
        where: { id: sponsorId },
        data: { pipelineStage: newStage },
      });

      logger.info("Sponsor pipeline stage updated", { sponsorId, newStage, intent });
    }
  }

  /**
   * Close a sponsorship deal
   */
  async closeDeal(
    sponsorId: string,
    tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM",
    monthlyAmount: number,
    startDate?: Date
  ): Promise<{ sponsorship: any; paymentLink?: string }> {
    // Update sponsor status
    await prisma.sponsor.update({
      where: { id: sponsorId },
      data: {
        pipelineStage: "closed",
        sponsorshipTier: tier,
        monthlyAmount,
        contractStart: startDate || new Date(),
        contractEnd: new Date(
          (startDate || new Date()).getTime() + 365 * 24 * 60 * 60 * 1000
        ), // 1 year
      },
    });

    // Create sponsorship record
    const adSpots: Record<string, number> = {
      BRONZE: 10,
      SILVER: 20,
      GOLD: 40,
      PLATINUM: 60,
    };

    const sponsorship = await prisma.sponsorship.create({
      data: {
        sponsorId,
        tier: tier.toLowerCase() as any,
        monthlyAmount,
        startDate: startDate || new Date(),
        status: "active",
        adSpotsPerMonth: adSpots[tier],
        socialMentions: tier === "BRONZE" ? 0 : tier === "SILVER" ? 2 : tier === "GOLD" ? 4 : 8,
        eventPromotion: tier !== "BRONZE",
      },
    });

    // Log activity
    await prisma.harperActivity.create({
      data: {
        sponsorId,
        action: "closed_deal",
        details: {
          tier,
          monthlyAmount,
          sponsorshipId: sponsorship.id,
        },
      },
    });

    logger.info("Sponsorship deal closed", { sponsorId, tier, monthlyAmount });

    // TODO: Generate Manifest Financial payment link when Manifest Financial is integrated
    // const paymentLink = await manifest.createSubscription({ ... });

    return {
      sponsorship,
      paymentLink: undefined, // Will be populated when Manifest Financial is integrated
    };
  }

  /**
   * Log a call with a sponsor
   */
  async logCall(
    sponsorId: string,
    callType: "voice_ai" | "human",
    duration: number,
    outcome: string,
    recordingUrl?: string,
    transcript?: string
  ): Promise<void> {
    await prisma.sponsorCall.create({
      data: {
        sponsorId,
        callType,
        duration,
        outcome,
        recording: recordingUrl,
        transcript,
        handledBy: callType === "voice_ai" ? "harper_ai" : "human_closer",
      },
    });

    // Update sponsor
    await prisma.sponsor.update({
      where: { id: sponsorId },
      data: {
        callsCompleted: { increment: 1 },
        lastContactedAt: new Date(),
      },
    });

    // Log activity
    await prisma.harperActivity.create({
      data: {
        sponsorId,
        action: "completed_call",
        details: { callType, duration, outcome },
      },
    });

    logger.info("Sponsor call logged", { sponsorId, callType, duration, outcome });
  }
}
