import "server-only";

import { z } from "zod";

import { mediaMetadataSchema } from "@/schemas/media";
import { composerDraftSchema } from "@/schemas/post";

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
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }

  // Publishing remains server-only because provider tokens, final payloads, and
  // retry state must never be assembled in the browser. Phase 7 will replace
  // this lightweight readiness check with the job-backed engine.
  return {
    ready: true,
    issues: parsed.data.media.flatMap((asset) => asset.warnings),
  };
}
