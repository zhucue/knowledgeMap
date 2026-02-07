import { z } from 'zod';

export const CreateSessionSchema = z.object({
  graphId: z.number().int().positive().optional(),
});

export const SendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  contextNodeId: z.number().int().positive().optional(),
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
