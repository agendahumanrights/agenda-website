import { z } from "zod";

import {
  localeSchema,
  optionalSearchSchema,
  paginationSchema,
} from "@/server/validations/common";

export const founderByBioKeySchema = z.object({
  locale: localeSchema,
  bioKey: z.string().min(1).max(120),
});

export const listFoundersSchema = z.object({
  locale: localeSchema,
});

const bioKeyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const founderBioKeySchema = z
  .string()
  .min(1)
  .max(120)
  .regex(bioKeyPattern, "bioKey must be URL-safe (lowercase letters, numbers, hyphens).");

export const founderTranslationInputSchema = z.object({
  locale: localeSchema,
  fullName: z.string().trim().min(1).max(200),
  professionalArea: z.string().trim().min(1).max(300),
  biography: z.string().trim().min(1).max(50_000),
});

export const createFounderBodySchema = z.object({
  email: z.string().trim().email().max(254),
  profileImageId: z.string().cuid(),
  bioKey: founderBioKeySchema.optional(),
  translations: z
    .array(founderTranslationInputSchema)
    .length(2)
    .superRefine((items, ctx) => {
      const locales = new Set(items.map((t) => t.locale));
      if (!locales.has("ar") || !locales.has("en")) {
        ctx.addIssue({
          code: "custom",
          message: "Both Arabic and English translations are required.",
        });
      }
    }),
});

/** bioKey is immutable after creation. */
export const updateFounderBodySchema = z.object({
  email: z.string().trim().email().max(254).optional(),
  profileImageId: z.string().cuid().nullable().optional(),
  translations: z
    .array(founderTranslationInputSchema)
    .length(2)
    .superRefine((items, ctx) => {
      const locales = new Set(items.map((t) => t.locale));
      if (!locales.has("ar") || !locales.has("en")) {
        ctx.addIssue({
          code: "custom",
          message: "Both Arabic and English translations are required.",
        });
      }
    })
    .optional(),
});

export const adminFounderListQuerySchema = paginationSchema
  .merge(optionalSearchSchema)
  .extend({
    locale: localeSchema.optional().default("ar"),
  });

/** Complete ordered ID list — must include every founder exactly once. */
export const reorderFoundersBodySchema = z.object({
  founderIds: z
    .array(z.string().cuid())
    .min(1)
    .superRefine((ids, ctx) => {
      const seen = new Set<string>();
      for (const id of ids) {
        if (seen.has(id)) {
          ctx.addIssue({
            code: "custom",
            message: "Duplicate founder IDs are not allowed.",
          });
          return;
        }
        seen.add(id);
      }
    }),
});

export type CreateFounderBody = z.infer<typeof createFounderBodySchema>;
export type UpdateFounderBody = z.infer<typeof updateFounderBodySchema>;
export type AdminFounderListQuery = z.infer<typeof adminFounderListQuerySchema>;
export type ReorderFoundersBody = z.infer<typeof reorderFoundersBodySchema>;
