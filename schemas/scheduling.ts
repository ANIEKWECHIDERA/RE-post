import { z } from 'zod';

export const cancelScheduledPostSchema = z.object({
  postId: z.string().uuid(),
});

export type CancelScheduledPostInput = z.infer<
  typeof cancelScheduledPostSchema
>;
