import { z } from "zod";

import { platformSchema } from "@/schemas/platform";

export const connectionActionSchema = z.object({
  platform: platformSchema,
});

export const connectionIdSchema = z.object({
  connectionId: z.string().uuid(),
});

export type ConnectionActionInput = z.infer<typeof connectionActionSchema>;
