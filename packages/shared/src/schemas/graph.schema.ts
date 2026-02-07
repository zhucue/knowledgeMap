import { z } from 'zod';

export const GenerateGraphSchema = z.object({
  topic: z.string().min(1).max(200),
  depth: z.number().int().min(1).max(3).optional().default(2),
  provider: z.enum(['openai', 'claude', 'tongyi']).optional(),
});

export const ExpandNodeSchema = z.object({
  depth: z.number().int().min(1).max(2).optional().default(2),
});

export type GenerateGraphInput = z.infer<typeof GenerateGraphSchema>;
export type ExpandNodeInput = z.infer<typeof ExpandNodeSchema>;
