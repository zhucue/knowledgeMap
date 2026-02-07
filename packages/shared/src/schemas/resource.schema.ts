import { z } from 'zod';

export const CreateResourceSchema = z.object({
  title: z.string().min(1).max(300),
  url: z.string().url().max(1000),
  resourceType: z.enum(['article', 'video', 'document', 'tutorial', 'book']),
  domain: z.string().min(1).max(100),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  description: z.string().max(2000).optional(),
  qualityScore: z.number().min(0).max(10).optional().default(5),
});

export const SearchResourceSchema = z.object({
  keyword: z.string().min(1).max(200),
  domain: z.string().max(100).optional(),
  resourceType: z.enum(['article', 'video', 'document', 'tutorial', 'book']).optional(),
});

export type CreateResourceInput = z.infer<typeof CreateResourceSchema>;
export type SearchResourceInput = z.infer<typeof SearchResourceSchema>;
