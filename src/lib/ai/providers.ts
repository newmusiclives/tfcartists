import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { getConfig } from "@/lib/config";
import { logger, measureDurationAsync } from "@/lib/logger";

export type AIProvider = "openai" | "claude";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  tokensUsed?: number;
}

class AIProviderService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private openaiKeyUsed: string | null = null;
  private anthropicKeyUsed: string | null = null;

  // Resolve the default provider (checks DB then env)
  private async resolveProvider(): Promise<AIProvider> {
    const val = await getConfig("DEFAULT_AI_PROVIDER", "claude");
    return val === "openai" ? "openai" : "claude";
  }

  // Lazy initialization — recreates client if the stored key has changed
  private async getOpenAI(): Promise<OpenAI> {
    const apiKey = await getConfig("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured. Set it in Admin → Settings.");
    }
    if (!this.openai || this.openaiKeyUsed !== apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.openaiKeyUsed = apiKey;
    }
    return this.openai;
  }

  private async getAnthropic(): Promise<Anthropic> {
    const apiKey = await getConfig("ANTHROPIC_API_KEY");
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured. Set it in Admin → Settings.");
    }
    if (!this.anthropic || this.anthropicKeyUsed !== apiKey) {
      this.anthropic = new Anthropic({ apiKey });
      this.anthropicKeyUsed = apiKey;
    }
    return this.anthropic;
  }

  async chat(
    messages: AIMessage[],
    options?: {
      provider?: AIProvider;
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<AIResponse> {
    const provider = options?.provider || await this.resolveProvider();
    const temperature = options?.temperature || 0.7;
    const maxTokens = options?.maxTokens || 500;
    const model = options?.model || (provider === "openai" ? "gpt-4o-mini" : "claude-3-5-sonnet-20241022");

    try {
      const { result, duration } = await measureDurationAsync(async () => {
        if (provider === "openai") {
          return this.chatOpenAI(messages, temperature, maxTokens, options?.model);
        } else {
          return this.chatClaude(messages, temperature, maxTokens, options?.model);
        }
      });

      logger.ai(provider, model, "chat", {
        durationMs: duration,
        tokensUsed: result.tokensUsed,
      });

      return result;
    } catch (error) {
      logger.aiFailure(provider, model, "chat", error, {
        messageCount: messages.length,
        maxTokens,
        temperature,
      });
      throw error;
    }
  }

  private async chatOpenAI(
    messages: AIMessage[],
    temperature: number,
    maxTokens: number,
    model?: string
  ): Promise<AIResponse> {
    const openai = await this.getOpenAI();

    const completion = await openai.chat.completions.create({
      model: model || "gpt-4o-mini",
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature,
      max_tokens: maxTokens,
    });

    return {
      content: completion.choices[0]?.message?.content || "",
      provider: "openai",
      tokensUsed: completion.usage?.total_tokens,
    };
  }

  private async chatClaude(
    messages: AIMessage[],
    temperature: number,
    maxTokens: number,
    model?: string
  ): Promise<AIResponse> {
    const anthropic = await this.getAnthropic();

    // Extract system message if present
    const systemMessage = messages.find((m) => m.role === "system");
    const conversationMessages = messages.filter((m) => m.role !== "system");

    const response = await anthropic.messages.create({
      model: model || "claude-3-5-sonnet-20241022",
      max_tokens: maxTokens,
      temperature,
      system: systemMessage?.content,
      messages: conversationMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    });

    const content = response.content[0];
    return {
      content: content.type === "text" ? content.text : "",
      provider: "claude",
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  }

  async getDefaultProvider(): Promise<AIProvider> {
    return this.resolveProvider();
  }
}

// Singleton instance - safe to create at module load now since constructor doesn't create clients
export const aiProvider = new AIProviderService();
