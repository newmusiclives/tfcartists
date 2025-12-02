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
  private openai: OpenAI;
  private anthropic: Anthropic;
  private defaultProvider: AIProvider;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.defaultProvider = (process.env.DEFAULT_AI_PROVIDER as AIProvider) || "claude";
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
    const completion = await this.openai.chat.completions.create({
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
    // Extract system message if present
    const systemMessage = messages.find((m) => m.role === "system");
    const conversationMessages = messages.filter((m) => m.role !== "system");

    const response = await this.anthropic.messages.create({
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

// Singleton instance
export const aiProvider = new AIProviderService();
