import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  ILlmProvider,
  LlmMessage,
  LlmCompletionOptions,
  LlmCompletionResult,
} from './providers/llm-provider.interface';
import { OpenAIProvider } from './providers/openai.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { TongyiProvider } from './providers/tongyi.provider';
import { DoubaoProvider } from './providers/doubao.provider';
import { DeepseekProvider } from './providers/deepseek.provider';

@Injectable()
export class LlmService implements OnModuleInit {
  private readonly logger = new Logger(LlmService.name);
  private providers = new Map<string, ILlmProvider>();
  private defaultProvider: string;

  constructor(private readonly configService: ConfigService) {
    this.defaultProvider = this.configService.get(
      'LLM_DEFAULT_PROVIDER',
      'openai',
    );
  }

  onModuleInit() {
    if (this.configService.get('LLM_OPENAI_API_KEY')) {
      this.providers.set('openai', new OpenAIProvider(this.configService));
      this.logger.log('OpenAI provider registered');
    }
    if (this.configService.get('LLM_CLAUDE_API_KEY')) {
      this.providers.set('claude', new ClaudeProvider(this.configService));
      this.logger.log('Claude provider registered');
    }
    if (this.configService.get('LLM_TONGYI_API_KEY')) {
      this.providers.set('tongyi', new TongyiProvider(this.configService));
      this.logger.log('Tongyi provider registered');
    }
    if (this.configService.get('LLM_DOUBAO_API_KEY')) {
      this.providers.set('doubao', new DoubaoProvider(this.configService));
      this.logger.log('Doubao provider registered');
    }
    if (this.configService.get('LLM_DEEPSEEK_API_KEY')) {
      this.providers.set('deepseek', new DeepseekProvider(this.configService));
      this.logger.log('DeepSeek provider registered');
    }
    if (this.providers.size === 0) {
      this.logger.warn('No LLM providers configured');
    }
  }

  getProvider(name?: string): ILlmProvider {
    const providerName = name || this.defaultProvider;
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(
        `LLM provider "${providerName}" not available. ` +
        `Configured: [${[...this.providers.keys()].join(', ')}]`,
      );
    }
    return provider;
  }

  getActiveProviderInfo() {
    const provider = this.providers.get(this.defaultProvider);
    return {
      provider: this.defaultProvider,
      model: provider?.model || 'not configured',
    };
  }

  getAvailableProviders() {
    return [...this.providers.entries()].map(([name, p]) => ({
      name,
      model: p.model,
    }));
  }

  async chatCompletion(
    messages: LlmMessage[],
    options?: LlmCompletionOptions,
    providerName?: string,
  ): Promise<LlmCompletionResult> {
    const provider = this.getProvider(providerName);
    return provider.chatCompletion(messages, options);
  }

  chatCompletionStream(
    messages: LlmMessage[],
    options?: LlmCompletionOptions,
    providerName?: string,
  ): AsyncIterable<string> {
    const provider = this.getProvider(providerName);
    return provider.chatCompletionStream(messages, options);
  }

  /**
   * 创建文本 embedding 向量
   * 使用 OpenAI 兼容接口
   */
  async createEmbedding(text: string): Promise<number[]> {
    const apiKey = this.configService.get('EMBEDDING_API_KEY')
      || this.configService.get('LLM_OPENAI_API_KEY');
    const baseURL = this.configService.get('EMBEDDING_BASE_URL')
      || this.configService.get('LLM_OPENAI_BASE_URL', 'https://api.openai.com/v1');
    const model = this.configService.get('EMBEDDING_MODEL', 'text-embedding-3-small');

    const client = new OpenAI({ apiKey, baseURL });
    const response = await client.embeddings.create({ model, input: text });
    return response.data[0].embedding;
  }
}
