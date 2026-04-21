import { z } from 'zod';

export const cancelScheduledPostSchema = z.object({
  postId: z.string().uuid(),
});

export const reschedulePostSchema = z.object({
  postId: z.string().uuid(),
  scheduledAt: z.string().trim().min(1, 'Choose a new scheduled time.'),
  timezone: z.string().trim().min(1).default('UTC'),
});

export const editScheduledPostSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().trim().min(1, 'Write something before saving.').max(3000),
});

export const duplicateScheduledPostSchema = z.object({
  postId: z.string().uuid(),
});

export const deleteScheduledPostSchema = z.object({
  postId: z.string().uuid(),
});

export const retryFailedPostSchema = z.object({
  postId: z.string().uuid(),
});

export type CancelScheduledPostInput = z.infer<
  typeof cancelScheduledPostSchema
>;
export type ReschedulePostInput = z.infer<typeof reschedulePostSchema>;
export type EditScheduledPostInput = z.infer<typeof editScheduledPostSchema>;
export type DuplicateScheduledPostInput = z.infer<
  typeof duplicateScheduledPostSchema
>;
export type DeleteScheduledPostInput = z.infer<
  typeof deleteScheduledPostSchema
>;
export type RetryFailedPostInput = z.infer<typeof retryFailedPostSchema>;
