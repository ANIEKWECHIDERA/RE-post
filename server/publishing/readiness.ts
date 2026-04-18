import 'server-only';

import { z } from 'zod';

import { mediaMetadataSchema } from '@/schemas/media';
import { composerDraftSchema } from '@/schemas/post';

const publishReadinessSchema = z.object({
  draft: composerDraftSchema,
  media: z.array(mediaMetadataSchema).default([]),
});

export type PublishReadinessInput = z.infer<typeof publishReadinessSchema>;

export function validatePublishReadiness(input: PublishReadinessInput) {
  const parsed = publishReadinessSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ready: false,
      issues: parsed.error.issues.map(issue => issue.message),
    };
  }

  // Publishing remains server-only because provider tokens, final payloads, and
  // retry state must never be assembled in the browser. The Phase 7 worker uses
  // this same boundary and keeps provider execution out of client code.
  return {
    ready: true,
    issues: parsed.data.media.flatMap(asset => asset.warnings),
  };
}
