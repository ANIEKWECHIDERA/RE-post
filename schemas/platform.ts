import { z } from "zod";

export const platformSchema = z.enum(["linkedin", "facebook", "instagram"]);

export type Platform = z.infer<typeof platformSchema>;

export const platformLabels: Record<Platform, string> = {
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
};
