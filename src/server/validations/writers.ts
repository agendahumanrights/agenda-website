import { z } from "zod";

import { WRITER_SOCIAL_PLATFORMS } from "@/types/writer";
import {
  localeSchema,
  optionalSearchSchema,
  paginationSchema,
} from "@/server/validations/common";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const writerSlugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(slugPattern, "slug must be URL-safe (lowercase letters, numbers, hyphens).");

export const writerBySlugSchema = z.object({
  locale: localeSchema,
  slug: z.string().min(1).max(120),
});

export const writerTranslationInputSchema = z.object({
  locale: localeSchema,
  fullName: z.string().trim().min(1).max(200),
  major: z.string().trim().min(1).max(300),
  biography: z.string().trim().min(1).max(50_000),
});

export const writerSocialLinkSchema = z.object({
  platform: z.enum(WRITER_SOCIAL_PLATFORMS),
  url: z
    .string()
    .trim()
    .url()
    .max(2048)
    .refine((value) => /^https?:\/\//i.test(value), {
      message: "Social links must use http or https.",
    }),
});

export const writerSocialLinksSchema = z
  .array(writerSocialLinkSchema)
  .max(WRITER_SOCIAL_PLATFORMS.length)
  .superRefine((items, ctx) => {
    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.platform)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate social platform: ${item.platform}.`,
        });
        return;
      }
      seen.add(item.platform);
    }
  });

function requireArEnTranslations(
  items: { locale: string }[],
  ctx: z.RefinementCtx,
) {
  const locales = new Set(items.map((t) => t.locale));
  if (!locales.has("ar") || !locales.has("en")) {
    ctx.addIssue({
      code: "custom",
      message: "Both Arabic and English translations are required.",
    });
  }
}

export const createWriterBodySchema = z.object({
  email: z.string().trim().email().max(254),
  profileImageId: z.string().cuid(),
  slug: writerSlugSchema.optional(),
  socialLinks: writerSocialLinksSchema.optional().default([]),
  translations: z
    .array(writerTranslationInputSchema)
    .length(2)
    .superRefine(requireArEnTranslations),
});

/** slug is immutable after creation. */
export const updateWriterBodySchema = z.object({
  email: z.string().trim().email().max(254).nullable().optional(),
  profileImageId: z.string().cuid().nullable().optional(),
  socialLinks: writerSocialLinksSchema.optional(),
  translations: z
    .array(writerTranslationInputSchema)
    .length(2)
    .superRefine(requireArEnTranslations)
    .optional(),
});

export const adminWriterListQuerySchema = paginationSchema
  .merge(optionalSearchSchema)
  .extend({
    locale: localeSchema.optional().default("ar"),
  });

export type CreateWriterBody = z.infer<typeof createWriterBodySchema>;
export type UpdateWriterBody = z.infer<typeof updateWriterBodySchema>;
export type AdminWriterListQuery = z.infer<typeof adminWriterListQuerySchema>;
