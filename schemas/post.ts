import { z } from "zod";

import { platformSchema } from "@/schemas/platform";

export const scheduleModeSchema = z.enum(["now", "scheduled"]);

export const composerDraftSchema = z
  .object({
    body: z.string().trim().min(1, "Write something before posting.").max(3000),
    platforms: z.array(platformSchema).min(1, "Choose at least one platform."),
    scheduleMode: scheduleModeSchema,
    scheduledAt: z.string().datetime().optional(),
  })
  .superRefine((value, context) => {
    if (value.scheduleMode === "scheduled" && !value.scheduledAt) {
      context.addIssue({
        code: "custom",
        message: "Choose a date and time for scheduled posts.",
        path: ["scheduledAt"],
      });
    }
  });

export type ComposerDraftInput = z.infer<typeof composerDraftSchema>;
