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
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ILlmProvider {
  readonly name: string;
  readonly model: string;

  chatCompletion(
    messages: LlmMessage[],
    options?: LlmCompletionOptions,
  ): Promise<LlmCompletionResult>;

  chatCompletionStream(
    messages: LlmMessage[],
    options?: LlmCompletionOptions,
  ): AsyncIterable<string>;

  healthCheck(): Promise<boolean>;
}
