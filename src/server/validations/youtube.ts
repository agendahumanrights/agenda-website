import { z } from "zod";

import { normalizeYouTubeUrl } from "@/lib/youtube";

/**
 * Optional YouTube URL for create/update bodies.
 * - `undefined` → field omitted (PATCH leave unchanged)
 * - `null` / `""` → clear
 * - valid URL → canonical `https://www.youtube.com/watch?v=…`
 */
export const optionalYoutubeUrlSchema = z
  .union([z.string(), z.null()])
  .optional()
  .superRefine((value, ctx) => {
    if (value === undefined || value === null) return;
    if (value.trim() === "") return;
    if (!normalizeYouTubeUrl(value)) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid or unsupported YouTube URL.",
      });
    }
  })
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null || value.trim() === "") return null;
    return normalizeYouTubeUrl(value);
  });
