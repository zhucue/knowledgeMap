import { z } from 'zod';

export const SearchTopicSchema = z.object({
  keyword: z.string().min(1).max(200),
});

export type SearchTopicInput = z.infer<typeof SearchTopicSchema>;
