import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  ILlmProvider,
  LlmMessage,
  LlmCompletionOptions,
  LlmCompletionResult,
} from './llm-provider.interface';

/**
 * Claude Provider — 通过 OpenAI 兼容接口调用 Claude
 * 使用 Anthropic 的 OpenAI 兼容端点，避免额外安装 @anthropic-ai/sdk
 */
@Injectable()
export class ClaudeProvider implements ILlmProvider {
  readonly name = 'claude';
  readonly model: string;
  private client: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.model = this.configService.get(
      'LLM_CLAUDE_MODEL',
      'claude-3-5-sonnet-20241022',
    );
    this.client = new OpenAI({
      apiKey: this.configService.get('LLM_CLAUDE_API_KEY'),
      baseURL: 'https://api.anthropic.com/v1/',
    });
  }

  async chatCompletion(
    messages: LlmMessage[],
    options?: LlmCompletionOptions,
  ): Promise<LlmCompletionResult> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content || '',
      model: response.model,
      provider: this.name,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  async *chatCompletionStream(
    messages: LlmMessage[],
    options?: LlmCompletionOptions,
  ): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4096,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.chatCompletion(
        [{ role: 'user', content: 'ping' }],
        { maxTokens: 5 },
      );
      return true;
    } catch {
      return false;
    }
  }
}
