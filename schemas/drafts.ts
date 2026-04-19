import { z } from 'zod';

export const draftIdSchema = z.object({
  draftId: z.string().uuid(),
});

export type DraftIdInput = z.infer<typeof draftIdSchema>;
