import { z } from "zod";

import { localeSchema } from "@/server/validations/common";

export const mediaPurposeSchema = z.enum([
  "publication-main",
  "publication-gallery",
  "publication-pdf",
  "event-main",
  "event-gallery",
  "founder-profile",
]);

export const mediaAltTextsSchema = z.object({
  ar: z.string().trim().max(500).optional().default(""),
  en: z.string().trim().max(500).optional().default(""),
});

export const mediaUploadMetaSchema = z.object({
  purpose: mediaPurposeSchema,
  altTexts: mediaAltTextsSchema.optional(),
});

export type MediaPurpose = z.infer<typeof mediaPurposeSchema>;
export type MediaUploadMeta = z.infer<typeof mediaUploadMetaSchema>;

export const mediaAltUpdateSchema = z.object({
  mediaAssetId: z.string().cuid(),
  altTexts: z.array(
    z.object({
      locale: localeSchema,
      altText: z.string().trim().max(500),
    }),
  ),
});
