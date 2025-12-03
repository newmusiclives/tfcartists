import { aiProvider, AIMessage } from "./providers";
import {
  RILEY_SYSTEM_PROMPT,
  getRileyPrompt,
  formatConversationHistory,
  RileyIntent,
} from "./riley-personality";
import { prisma } from "@/lib/db";
import { activateAirplay } from "@/lib/radio/airplay-system";
import { logger } from "@/lib/logger";
import { messageDelivery, MessageChannel } from "@/lib/messaging/delivery-service";

export interface RileyConversationContext {
  artistId: string;
  artistName?: string;
  genre?: string;
  nextShowDate?: string;
  venue?: string;
  conversationHistory: Array<{ role: string; content: string }>;
  intent: RileyIntent;
}

export class RileyAgent {
  /**
   * Generate Riley's response based on conversation context
   */
  async generateResponse(context: RileyConversationContext): Promise<string> {
    const { artistName, genre, nextShowDate, venue, conversationHistory, intent } = context;

    // Build the prompt with Riley's personality + intent-specific instructions
    const intentPrompt = getRileyPrompt(intent, {
      artistName,
      genre,
      nextShowDate,
      venue,
      hasRespondedBefore: conversationHistory.length > 0,
    });

    // Format conversation history
    const history = formatConversationHistory(conversationHistory);

    // Build messages for AI
    const messages: AIMessage[] = [
      {
        role: "system",
        content: RILEY_SYSTEM_PROMPT,
      },
      {
        role: "system",
        content: intentPrompt,
      },
      {
        role: "user",
        content: `CONVERSATION HISTORY:\n${history}\n\nGenerate Riley's next message. Remember: SHORT, human, friendly. 1-3 sentences max.`,
      },
    ];

    // Get AI response
    const response = await aiProvider.chat(messages, {
      temperature: 0.8, // Higher temperature for more natural, varied responses
      maxTokens: 200, // Keep responses short
    });

    return response.content.trim();
  }

  /**
   * Send a message to an artist (stores in DB and would trigger actual delivery)
   */
  async sendMessage(
    artistId: string,
    content: string,
    intent: RileyIntent,
    channel: string = "sms"
  ): Promise<void> {
    // Get or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        artistId,
        isActive: true,
        channel,
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          artistId,
          channel,
          isActive: true,
        },
      });
    }

    // Store the message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "riley",
        content,
        intent,
        aiProvider: aiProvider.getDefaultProvider(),
      },
    });

    // Update artist last contacted
    const artist = await prisma.artist.update({
      where: { id: artistId },
      data: {
        lastContactedAt: new Date(),
        conversationCount: {
          increment: 1,
        },
      },
    });

    // Activate FREE airplay if first contact and not already activated
    if (intent === "initial_outreach" && !artist.airplayActivatedAt) {
      await activateAirplay(artistId);
    }

    // Log Riley's activity
    await prisma.rileyActivity.create({
      data: {
        action: "sent_message",
        artistId,
        details: {
          intent,
          channel,
          messagePreview: content.substring(0, 100),
        },
        aiProvider: aiProvider.getDefaultProvider(),
      },
    });

    // Actually send the message via SMS/Email/Instagram
    let deliveryAddress = "";

    if (channel === "sms" && artist.phone) {
      deliveryAddress = artist.phone;
    } else if (channel === "email" && artist.email) {
      deliveryAddress = artist.email;
    } else if (channel === "instagram" && artist.sourceHandle && artist.discoverySource === "instagram") {
      deliveryAddress = artist.sourceHandle;
    } else {
      logger.warn("No delivery address available for artist", {
        artistId,
        channel,
        hasPhone: !!artist.phone,
        hasEmail: !!artist.email,
        hasInstagram: !!(artist.sourceHandle && artist.discoverySource === "instagram"),
      });
      return;
    }

    // Attempt message delivery
    const deliveryResult = await messageDelivery.send({
      to: deliveryAddress,
      content,
      channel: channel as MessageChannel,
    });

    // Log delivery result
    if (deliveryResult.success) {
      logger.info("Riley message delivered successfully", {
        artistId,
        channel,
        intent,
        messageId: deliveryResult.messageId,
        messageLength: content.length,
      });

      // Update message with delivery status
      await prisma.message.updateMany({
        where: {
          conversationId: conversation.id,
          role: "riley",
          content,
        },
        data: {
          deliveryStatus: "delivered",
          externalMessageId: deliveryResult.messageId,
          deliveredAt: new Date(),
        },
      });
    } else {
      logger.error("Riley message delivery failed", {
        artistId,
        channel,
        intent,
        error: deliveryResult.error,
      });

      // Update message with failure status
      await prisma.message.updateMany({
        where: {
          conversationId: conversation.id,
          role: "riley",
          content,
        },
        data: {
          deliveryStatus: "failed",
          deliveryError: deliveryResult.error,
        },
      });
    }
  }

  /**
   * Process an incoming message from an artist
   */
  async handleArtistMessage(
    artistId: string,
    messageContent: string,
    channel: string = "sms"
  ): Promise<string> {
    // Get artist data
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      include: {
        conversations: {
          where: {
            channel,
            isActive: true,
          },
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
              take: 20, // Last 20 messages for context
            },
          },
        },
      },
    });

    if (!artist) {
      throw new Error("Artist not found");
    }

    // Store artist's message
    const conversation = artist.conversations[0];
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "artist",
        content: messageContent,
      },
    });

    // Determine intent based on conversation state and message content
    const intent = this.determineIntent(artist, messageContent);

    // Build conversation history
    const conversationHistory = conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Add the new artist message
    conversationHistory.push({
      role: "artist",
      content: messageContent,
    });

    // Generate Riley's response
    const response = await this.generateResponse({
      artistId: artist.id,
      artistName: artist.name,
      genre: artist.genre || undefined,
      nextShowDate: artist.nextShowDate?.toISOString(),
      venue: artist.nextShowVenue || undefined,
      conversationHistory,
      intent,
    });

    // Send Riley's response
    await this.sendMessage(artistId, response, intent, channel);

    // Update artist pipeline stage based on intent
    await this.updateArtistStage(artistId, intent);

    return response;
  }

  /**
   * Determine Riley's intent based on context
   */
  private determineIntent(
    artist: { status: string; pipelineStage: string; nextShowDate: Date | null },
    messageContent: string
  ): RileyIntent {
    const content = messageContent.toLowerCase();

    // Keyword-based intent detection
    if (content.includes("show") || content.includes("gig") || content.includes("perform")) {
      if (artist.nextShowDate) {
        return "book_show";
      }
      return "qualify_live_shows";
    }

    if (content.includes("how") || content.includes("what") || content.includes("?")) {
      return "educate_product";
    }

    if (
      content.includes("not sure") ||
      content.includes("but") ||
      content.includes("concern")
    ) {
      return "handle_objection";
    }

    if (content.includes("yes") || content.includes("interested") || content.includes("sure")) {
      if (artist.pipelineStage === "contacted") {
        return "qualify_live_shows";
      }
      if (artist.pipelineStage === "engaged") {
        return "educate_product";
      }
      if (artist.pipelineStage === "qualified") {
        return "book_show";
      }
    }

    // Default based on pipeline stage
    switch (artist.pipelineStage) {
      case "discovery":
        return "initial_outreach";
      case "contacted":
        return "qualify_live_shows";
      case "engaged":
        return "educate_product";
      case "qualified":
        return "book_show";
      default:
        return "initial_outreach";
    }
  }

  /**
   * Update artist's pipeline stage based on conversation progress
   */
  private async updateArtistStage(artistId: string, intent: RileyIntent): Promise<void> {
    const stageMap: Record<RileyIntent, { status?: string; stage?: string }> = {
      initial_outreach: { status: "CONTACTED", stage: "contacted" },
      qualify_live_shows: { status: "ENGAGED", stage: "engaged" },
      educate_product: { status: "ENGAGED", stage: "engaged" },
      book_show: { status: "QUALIFIED", stage: "qualified" },
      send_reminder: { status: "ONBOARDING", stage: "onboarding" },
      motivate: { status: "ONBOARDING", stage: "onboarding" },
      handle_objection: {}, // Don't change stage
      celebrate_win: { status: "ACTIVATED", stage: "activated" },
      request_referral: { status: "ACTIVE", stage: "active" },
    };

    const update = stageMap[intent];
    if (update.status || update.stage) {
      await prisma.artist.update({
        where: { id: artistId },
        data: {
          ...(update.status && { status: update.status as any }),
          ...(update.stage && { pipelineStage: update.stage }),
        },
      });
    }
  }
}

// Singleton instance
export const riley = new RileyAgent();
