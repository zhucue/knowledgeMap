import { ChatMessageRole } from '../constants';

export interface ChatSession {
  id: number;
  userId: number;
  graphId: number | null;
  title: string;
  status: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  sessionId: number;
  role: ChatMessageRole;
  content: string;
  contextNodeId: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface SessionSummary {
  id: number;
  title: string;
  graphTitle?: string;
  messageCount: number;
  updatedAt: string;
}
