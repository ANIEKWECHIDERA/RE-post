import { z } from 'zod';

export const publishWorkerRunSchema = z.object({
  limit: z.coerce.number().int().min(1).max(25).optional(),
});

export type PublishWorkerRunInput = z.infer<typeof publishWorkerRunSchema>;
