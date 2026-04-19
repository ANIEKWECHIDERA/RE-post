import { z } from 'zod';

import { platformSchema } from '@/schemas/platform';

export const scheduleModeSchema = z.enum(['now', 'scheduled']);

export const composerDraftSchema = z
  .object({
    body: z.string().trim().min(1, 'Write something before posting.').max(3000),
    platforms: z.array(platformSchema).min(1, 'Choose at least one platform.'),
    scheduleMode: scheduleModeSchema,
    scheduledAt: z.string().datetime().optional(),
  })
  .superRefine((value, context) => {
    if (value.scheduleMode === 'scheduled' && !value.scheduledAt) {
      context.addIssue({
        code: 'custom',
        message: 'Choose a date and time for scheduled posts.',
        path: ['scheduledAt'],
      });
      return;
    }

    if (
      value.scheduleMode === 'scheduled' &&
      value.scheduledAt &&
      Date.parse(value.scheduledAt) <= Date.now() + 60 * 1000
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Schedule at least one minute in the future.',
        path: ['scheduledAt'],
      });
    }
  });

export type ComposerDraftInput = z.infer<typeof composerDraftSchema>;

export const composerServerSchema = composerDraftSchema.extend({
  timezone: z.string().trim().min(1).default('UTC'),
  mediaMetadata: z.array(z.unknown()).default([]),
});

export type ComposerServerInput = z.infer<typeof composerServerSchema>;
