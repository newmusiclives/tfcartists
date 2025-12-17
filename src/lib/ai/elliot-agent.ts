import { aiProvider, AIMessage } from "./providers";
import { ELLIOT_PERSONALITIES } from "./elliot-personalities";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Elliot Agent - Listener Growth Engine
 * Manages viral content creation, growth campaigns, and listener engagement
 */

export interface ContentGenerationContext {
  type: "tiktok" | "reel" | "short" | "story" | "post";
  category: "artist_spotlight" | "dj_moment" | "behind_scenes" | "listener_story";
  artistId?: string;
  artistName?: string;
  theme?: string;
}

export interface CampaignContext {
  name: string;
  type: "artist_referral" | "viral_push" | "habit_builder" | "community_event";
  targetAudience: "new_listeners" | "at_risk" | "power_users" | "all";
  goalType: "listeners" | "sessions" | "retention" | "virality";
  goalTarget: number;
}

export class ElliotAgent {
  /**
   * Generate viral content using AI
   */
  async generateContent(context: ContentGenerationContext): Promise<{
    title: string;
    description: string;
    script: string;
    hashtags: string[];
  }> {
    // Select appropriate team member based on content type
    const teamMember = this.selectTeamMember(context.type);
    const personality = ELLIOT_PERSONALITIES[teamMember];

    // Build AI prompt for content generation
    const messages: AIMessage[] = [
      {
        role: "system",
        content: `You are ${teamMember.toUpperCase()}, ${personality.role} for North Country Radio.

YOUR PERSONALITY:
${personality.traits.join("\n")}

YOUR FOCUS:
${personality.focus}

YOUR VOICE:
${personality.voice}

TASK: Create viral ${context.type} content for ${context.category}.
${context.artistName ? `FEATURING: ${context.artistName}` : ""}
${context.theme ? `THEME: ${context.theme}` : ""}

Platform: ${context.type}
Target: Music lovers, country/americana fans, indie artists

OUTPUT FORMAT (JSON):
{
  "title": "Hook title (5-10 words)",
  "description": "Content description for platform",
  "script": "Full video script or post copy",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`,
      },
      {
        role: "user",
        content: `Create compelling ${context.type} content that will go viral and bring new listeners to North Country Radio. Make it authentic, engaging, and shareable.`,
      },
    ];

    const response = await aiProvider.chat(messages, {
      temperature: 0.9, // Higher creativity for content
      maxTokens: 800,
    });

    // Parse JSON response
    try {
      const content = JSON.parse(response.content);

      // Store in database
      const viralContent = await prisma.viralContent.create({
        data: {
          type: context.type,
          title: content.title,
          description: content.description,
          platform: this.getPlatform(context.type),
          createdBy: teamMember,
          category: context.category,
          artistId: context.artistId,
          artistName: context.artistName,
          status: "draft",
          metadata: {
            script: content.script,
            hashtags: content.hashtags,
          },
        },
      });

      logger.info("Viral content generated", {
        contentId: viralContent.id,
        type: context.type,
        category: context.category,
        createdBy: teamMember,
      });

      return content;
    } catch (error) {
      logger.error("Failed to parse content generation response", { error });
      throw new Error("Content generation failed");
    }
  }

  /**
   * Launch a growth campaign
   */
  async launchCampaign(context: CampaignContext): Promise<string> {
    // Determine which team member should manage this campaign
    const teamMember = this.selectCampaignManager(context.type);

    // Create campaign in database
    const campaign = await prisma.growthCampaign.create({
      data: {
        name: context.name,
        type: context.type,
        targetAudience: context.targetAudience,
        channel: this.selectChannel(context.type),
        managedBy: teamMember,
        goalType: context.goalType,
        goalTarget: context.goalTarget,
        status: "active",
        startDate: new Date(),
      },
    });

    // Generate campaign strategy using AI
    const personality = ELLIOT_PERSONALITIES[teamMember];
    const messages: AIMessage[] = [
      {
        role: "system",
        content: `You are ${teamMember.toUpperCase()}, ${personality.role} for North Country Radio.

CAMPAIGN: ${context.name}
TYPE: ${context.type}
TARGET: ${context.targetAudience}
GOAL: Get ${context.goalTarget} ${context.goalType}

Create a detailed campaign execution plan.`,
      },
      {
        role: "user",
        content: "Create a step-by-step campaign plan with specific tactics, timing, and success metrics.",
      },
    ];

    const response = await aiProvider.chat(messages, {
      temperature: 0.7,
      maxTokens: 600,
    });

    // Log campaign launch
    await prisma.elliotActivity.create({
      data: {
        action: "launched_campaign",
        teamMember,
        campaignId: campaign.id,
        details: {
          campaignName: context.name,
          strategy: response.content,
        },
      },
    });

    logger.info("Growth campaign launched", {
      campaignId: campaign.id,
      name: context.name,
      type: context.type,
      managedBy: teamMember,
    });

    return campaign.id;
  }

  /**
   * Engage with listeners based on their status
   */
  async engageListener(
    listenerId: string,
    engagementType: "welcome" | "retention" | "reactivation" | "reward"
  ): Promise<void> {
    const listener = await prisma.listener.findUnique({
      where: { id: listenerId },
      include: {
        sessions: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!listener) {
      throw new Error(`Listener ${listenerId} not found`);
    }

    // Select appropriate team member
    const teamMember = this.selectEngagementAgent(listener.status);
    const personality = ELLIOT_PERSONALITIES[teamMember];

    // Generate personalized engagement message
    const messages: AIMessage[] = [
      {
        role: "system",
        content: `You are ${teamMember.toUpperCase()}, ${personality.role}.

LISTENER PROFILE:
- Status: ${listener.status}
- Tier: ${listener.tier}
- Total Sessions: ${listener.totalSessions}
- Listening Hours: ${listener.totalListeningHours}
- Streak: ${listener.listeningStreak} days
- Favorite DJ: ${listener.preferredDJ || "unknown"}

ENGAGEMENT TYPE: ${engagementType}

YOUR VOICE: ${personality.voice}

Create a personalized, authentic message to engage this listener.`,
      },
      {
        role: "user",
        content: `Write a brief, engaging message (2-3 sentences) for this ${engagementType} touchpoint.`,
      },
    ];

    const response = await aiProvider.chat(messages, {
      temperature: 0.8,
      maxTokens: 200,
    });

    // Store engagement
    await prisma.listenerEngagement.create({
      data: {
        listenerId,
        type: engagementType,
        platform: listener.email ? "email" : "push",
        content: response.content,
        sentiment: "positive",
      },
    });

    // Log activity
    await prisma.elliotActivity.create({
      data: {
        action: "activated_listener",
        teamMember,
        listenerId,
        details: {
          engagementType,
          message: response.content,
        },
      },
    });

    logger.info("Listener engaged", {
      listenerId,
      engagementType,
      teamMember,
    });
  }

  /**
   * Analyze listener behavior and identify at-risk listeners
   */
  async identifyAtRiskListeners(): Promise<string[]> {
    const atRiskListeners = await prisma.listener.findMany({
      where: {
        OR: [
          {
            lastListenedAt: {
              lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days
            },
            status: "ACTIVE",
          },
          {
            listeningStreak: 0,
            totalSessions: {
              gte: 5,
            },
          },
        ],
      },
      select: { id: true },
    });

    // Update status to AT_RISK
    await prisma.listener.updateMany({
      where: {
        id: {
          in: atRiskListeners.map((l) => l.id),
        },
      },
      data: {
        status: "AT_RISK",
      },
    });

    logger.info("At-risk listeners identified", {
      count: atRiskListeners.length,
    });

    return atRiskListeners.map((l) => l.id);
  }

  /**
   * Daily automation - run content creation and engagement
   */
  async runDailyAutomation(): Promise<{
    contentCreated: number;
    listenersEngaged: number;
    atRiskIdentified: number;
  }> {
    logger.info("Starting Elliot daily automation");

    let contentCreated = 0;
    let listenersEngaged = 0;

    // 1. Generate daily content (1 TikTok, 1 Reel, 1 Story)
    const contentTypes: Array<ContentGenerationContext["type"]> = ["tiktok", "reel", "story"];
    const categories: Array<ContentGenerationContext["category"]> = [
      "artist_spotlight",
      "dj_moment",
      "behind_scenes",
    ];

    for (let i = 0; i < 3; i++) {
      try {
        await this.generateContent({
          type: contentTypes[i],
          category: categories[i],
        });
        contentCreated++;
      } catch (error) {
        logger.error("Failed to generate content", { type: contentTypes[i], error });
      }
    }

    // 2. Identify and engage at-risk listeners
    const atRiskIds = await this.identifyAtRiskListeners();

    for (const listenerId of atRiskIds.slice(0, 10)) {
      // Limit to 10 per day
      try {
        await this.engageListener(listenerId, "reactivation");
        listenersEngaged++;
      } catch (error) {
        logger.error("Failed to engage listener", { listenerId, error });
      }
    }

    // 3. Welcome new listeners
    const newListeners = await prisma.listener.findMany({
      where: {
        status: "NEW",
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      take: 20,
    });

    for (const listener of newListeners) {
      try {
        await this.engageListener(listener.id, "welcome");
        listenersEngaged++;
      } catch (error) {
        logger.error("Failed to welcome listener", { listenerId: listener.id, error });
      }
    }

    logger.info("Elliot daily automation completed", {
      contentCreated,
      listenersEngaged,
      atRiskIdentified: atRiskIds.length,
    });

    return {
      contentCreated,
      listenersEngaged,
      atRiskIdentified: atRiskIds.length,
    };
  }

  // Helper methods
  private selectTeamMember(
    type: ContentGenerationContext["type"]
  ): keyof typeof ELLIOT_PERSONALITIES {
    const mapping: Record<string, keyof typeof ELLIOT_PERSONALITIES> = {
      tiktok: "nova",
      reel: "river",
      short: "sage",
      story: "orion",
      post: "elliot",
    };
    return mapping[type] || "elliot";
  }

  private selectCampaignManager(
    type: CampaignContext["type"]
  ): keyof typeof ELLIOT_PERSONALITIES {
    const mapping: Record<string, keyof typeof ELLIOT_PERSONALITIES> = {
      artist_referral: "orion",
      viral_push: "nova",
      habit_builder: "sage",
      community_event: "river",
    };
    return mapping[type] || "elliot";
  }

  private selectEngagementAgent(
    status: string
  ): keyof typeof ELLIOT_PERSONALITIES {
    const mapping: Record<string, keyof typeof ELLIOT_PERSONALITIES> = {
      NEW: "orion",
      ACTIVE: "sage",
      AT_RISK: "river",
      CHURNED: "nova",
      POWER_USER: "elliot",
    };
    return mapping[status] || "elliot";
  }

  private getPlatform(type: ContentGenerationContext["type"]): string {
    const mapping: Record<string, string> = {
      tiktok: "tiktok",
      reel: "instagram",
      short: "youtube",
      story: "instagram",
      post: "facebook",
    };
    return mapping[type] || "social";
  }

  private selectChannel(type: CampaignContext["type"]): string {
    const mapping: Record<string, string> = {
      artist_referral: "email",
      viral_push: "social",
      habit_builder: "push",
      community_event: "community",
    };
    return mapping[type] || "social";
  }
}

// Singleton instance
export const elliot = new ElliotAgent();
