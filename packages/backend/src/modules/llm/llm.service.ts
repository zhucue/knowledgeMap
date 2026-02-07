import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

export interface LlmCompletionResult {
  content: string;
  model: string;
  provider: string;
}

@Injectable()
export class LlmService {
  private defaultProvider: string;

  constructor(private readonly configService: ConfigService) {
    this.defaultProvider = this.configService.get('LLM_DEFAULT_PROVIDER', 'openai');
  }

  getActiveProviderInfo() {
    return {
      provider: this.defaultProvider,
      model: this.configService.get(`LLM_${this.defaultProvider.toUpperCase()}_MODEL`, 'gpt-4o'),
    };
  }

  getAvailableProviders() {
    const providers: { name: string; model: string }[] = [];
    if (this.configService.get('LLM_OPENAI_API_KEY')) {
      providers.push({ name: 'openai', model: this.configService.get('LLM_OPENAI_MODEL', 'gpt-4o') });
    }
    if (this.configService.get('LLM_CLAUDE_API_KEY')) {
      providers.push({ name: 'claude', model: this.configService.get('LLM_CLAUDE_MODEL', 'claude-3-5-sonnet-20241022') });
    }
    if (this.configService.get('LLM_TONGYI_API_KEY')) {
      providers.push({ name: 'tongyi', model: this.configService.get('LLM_TONGYI_MODEL', 'qwen-plus') });
    }
    return providers;
  }

  // TODO: Phase 2 will implement actual LLM provider calls
  async chatCompletion(messages: LlmMessage[], options?: LlmCompletionOptions): Promise<LlmCompletionResult> {
    return {
      content: 'LLM integration will be implemented in Phase 2',
      model: 'placeholder',
      provider: this.defaultProvider,
    };
  }
}
