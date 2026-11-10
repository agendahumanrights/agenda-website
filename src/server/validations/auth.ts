import { z } from "zod";

export const loginBodySchema = z.object({
  email: z.string().trim().min(1).max(254).email(),
  password: z.string().min(1).max(128),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
