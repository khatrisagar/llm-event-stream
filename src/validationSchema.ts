import { z } from "zod";

const MAX_TOKENS = 500;

export const chatMessageSchema = z.object({
  message: z
    .string()
    .max(MAX_TOKENS, {
      message: `Message must be <= ${MAX_TOKENS} characters`,
    }),
  chatId: z.uuid().optional(),
});
