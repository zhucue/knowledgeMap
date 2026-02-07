import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ILlmProvider,
  LlmMessage,
  LlmCompletionOptions,
  LlmCompletionResult,
} from './providers/llm-provider.interface';
import { OpenAIProvider } from './providers/openai.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { TongyiProvider } from './providers/tongyi.provider';

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
}
