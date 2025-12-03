import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

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
  private defaultProvider: AIProvider;

  constructor() {
    this.defaultProvider = (process.env.DEFAULT_AI_PROVIDER as AIProvider) || "claude";
  }

  // Lazy initialization - only create clients when needed
  private getOpenAI(): OpenAI {
    if (!this.openai) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not configured. Set it in your environment variables.");
      }
      this.openai = new OpenAI({ apiKey });
    }
    return this.openai;
  }

  private getAnthropic(): Anthropic {
    if (!this.anthropic) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY is not configured. Set it in your environment variables.");
      }
      this.anthropic = new Anthropic({ apiKey });
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
    const provider = options?.provider || this.defaultProvider;
    const temperature = options?.temperature || 0.7;
    const maxTokens = options?.maxTokens || 500;

    if (provider === "openai") {
      return this.chatOpenAI(messages, temperature, maxTokens, options?.model);
    } else {
      return this.chatClaude(messages, temperature, maxTokens, options?.model);
    }
  }

  private async chatOpenAI(
    messages: AIMessage[],
    temperature: number,
    maxTokens: number,
    model?: string
  ): Promise<AIResponse> {
    const openai = this.getOpenAI(); // Lazy load

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
    const anthropic = this.getAnthropic(); // Lazy load

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

  getDefaultProvider(): AIProvider {
    return this.defaultProvider;
  }
}

// Singleton instance - safe to create at module load now since constructor doesn't create clients
export const aiProvider = new AIProviderService();
