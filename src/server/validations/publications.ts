import { z } from "zod";

import { MEDIA_LIMITS } from "@/server/storage/limits";
import {
  catalogueDateSortSchema,
  localeSchema,
  optionalSearchSchema,
  paginationSchema,
} from "@/server/validations/common";
import { optionalYoutubeUrlSchema } from "@/server/validations/youtube";

/** Absolute ceiling for update payloads so grandfathered over-limit galleries still parse. */
const GALLERY_IDS_UPDATE_CEILING = 100;

/** Public/admin catalogue filter by category slug (legacy REPORT/BLOG/… or new slugs). */
export const publicationCategorySlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9_-]*$/,
    "Category slug must be URL-safe.",
  );

export const publicationStatusSchema = z.enum(["DRAFT", "PUBLISHED"]);

export const publicPublicationListQuerySchema = paginationSchema
  .merge(optionalSearchSchema)
  .extend({
    locale: localeSchema,
    category: publicationCategorySlugSchema.optional(),
    /** Sort by admin publication date (`publishedAt`), not createdAt. */
    sort: catalogueDateSortSchema,
  });

export const publicPublicationBySlugSchema = z.object({
  locale: localeSchema,
  slug: z.string().min(1).max(160),
});

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const publicationSlugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(slugPattern, "Slug must be URL-safe (lowercase letters, numbers, hyphens).");

/** Draft translations may be incomplete; publish rules enforced in the service. */
export const publicationTranslationInputSchema = z.object({
  locale: localeSchema,
  title: z.string().max(300).default(""),
  subtitle: z.string().max(500).default(""),
  description: z.string().max(200_000).default(""),
});

export const createPublicationBodySchema = z.object({
  slug: publicationSlugSchema.optional(),
  categoryId: z.string().cuid(),
  status: publicationStatusSchema.default("DRAFT"),
  publishedAt: z.coerce.date().nullable().optional(),
  authorFounderId: z.string().cuid().nullable().optional(),
  mainImageId: z.string().cuid().nullable().optional(),
  pdfId: z.string().cuid().nullable().optional(),
  youtubeUrl: optionalYoutubeUrlSchema,
  galleryImageIds: z
    .array(z.string().cuid())
    .max(MEDIA_LIMITS.maxImagesPerItem)
    .optional()
    .default([]),
  translations: z.array(publicationTranslationInputSchema).min(1).max(2),
  featureOnHomepage: z.boolean().optional().default(false),
});

/**
 * Slug is immutable after creation — omitted from updates.
 * Status transitions: DRAFT ↔ PUBLISHED (publish/unpublish).
 * Gallery max is a parse ceiling only; service enforces maxImagesPerItem with
 * grandfathering for existing over-limit records.
 */
export const updatePublicationBodySchema = z.object({
  categoryId: z.string().cuid().optional(),
  status: publicationStatusSchema.optional(),
  publishedAt: z.coerce.date().nullable().optional(),
  authorFounderId: z.string().cuid().nullable().optional(),
  mainImageId: z.string().cuid().nullable().optional(),
  pdfId: z.string().cuid().nullable().optional(),
  youtubeUrl: optionalYoutubeUrlSchema,
  galleryImageIds: z
    .array(z.string().cuid())
    .max(GALLERY_IDS_UPDATE_CEILING)
    .optional(),
  translations: z.array(publicationTranslationInputSchema).min(1).max(2).optional(),
  featureOnHomepage: z.boolean().optional(),
});

export const adminPublicationListQuerySchema = paginationSchema
  .merge(optionalSearchSchema)
  .extend({
    category: publicationCategorySlugSchema.optional(),
    status: publicationStatusSchema.optional(),
    locale: localeSchema.optional().default("ar"),
    sort: z
      .enum(["createdAt_desc", "createdAt_asc", "publishedAt_desc"])
      .optional()
      .default("createdAt_desc"),
  });

/** @deprecated Prefer createPublicationBodySchema */
export const createPublicationSchema = createPublicationBodySchema;
/** @deprecated Prefer updatePublicationBodySchema */
export const updatePublicationSchema = updatePublicationBodySchema.extend({
  id: z.string().cuid(),
});

export type PublicPublicationListQuery = z.infer<
  typeof publicPublicationListQuerySchema
>;
export type CreatePublicationBody = z.infer<typeof createPublicationBodySchema>;
export type UpdatePublicationBody = z.infer<typeof updatePublicationBodySchema>;
export type AdminPublicationListQuery = z.infer<
  typeof adminPublicationListQuerySchema
>;
