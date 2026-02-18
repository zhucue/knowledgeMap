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
 * 通义千问 Provider — 通过 DashScope OpenAI 兼容接口调用
 */
@Injectable()
export class TongyiProvider implements ILlmProvider {
  readonly name = 'tongyi';
  readonly model: string;
  private client: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.model = this.configService.get('LLM_TONGYI_MODEL', 'qwen-plus');
    this.client = new OpenAI({
      apiKey: this.configService.get('LLM_TONGYI_API_KEY'),
      baseURL: this.configService.get(
        'LLM_TONGYI_BASE_URL',
        'https://dashscope.aliyuncs.com/compatible-mode/v1',
      ),
      timeout: 120000, // 120秒超时
      maxRetries: 2, // 最多重试2次
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
      response_format:
        options?.responseFormat === 'json'
          ? { type: 'json_object' }
          : undefined,
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
