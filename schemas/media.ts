import { z } from "zod";

import { platformSchema } from "@/schemas/platform";

export const mediaKindSchema = z.enum(["image", "video"]);

export const acceptedMediaMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export const acceptedMediaMimeTypeSchema = z.enum(acceptedMediaMimeTypes);

export const maxMediaFileSize = 100 * 1024 * 1024;

export const mediaMetadataSchema = z.object({
  id: z.string().uuid().optional(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  byteSize: z.number().int().positive(),
  kind: mediaKindSchema,
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  durationSeconds: z.number().positive().optional(),
  aspectRatio: z.number().positive().optional(),
  selectedPlatforms: z.array(platformSchema).min(1),
  warnings: z.array(z.string()).default([]),
});

export type MediaMetadata = z.infer<typeof mediaMetadataSchema>;

export const platformMediaTargets = {
  linkedin: [
    { label: "Shared image", width: 1200, height: 627, ratio: 1200 / 627 },
    { label: "Video landscape", width: 1920, height: 1080, ratio: 16 / 9 },
    { label: "Video portrait", width: 1080, height: 1350, ratio: 4 / 5 },
  ],
  facebook: [
    { label: "Portrait image", width: 1080, height: 1350, ratio: 4 / 5 },
    { label: "Square image", width: 1080, height: 1080, ratio: 1 },
  ],
  instagram: [
    { label: "Square post", width: 1080, height: 1080, ratio: 1 },
    { label: "Portrait post", width: 1080, height: 1350, ratio: 4 / 5 },
    { label: "Landscape post", width: 1080, height: 566, ratio: 1080 / 566 },
  ],
} as const;
