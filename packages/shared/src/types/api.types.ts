export interface SSEEvent {
  step: string;
  status: 'processing' | 'done' | 'error';
  progress: number;
  message?: string;
  data?: unknown;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}
