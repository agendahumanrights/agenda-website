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

export const eventStatusSchema = z.enum(["DRAFT", "PUBLISHED"]);

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const eventSlugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(slugPattern, "Slug must be URL-safe (lowercase letters, numbers, hyphens).");

export const publicEventListQuerySchema = paginationSchema
  .merge(optionalSearchSchema)
  .extend({
    locale: localeSchema,
    /** Sort by admin event date (`eventDate`), not createdAt. */
    sort: catalogueDateSortSchema,
    /** Filter by record creation date (requirements §1.3), not eventDate. */
    createdFrom: z.coerce.date().optional(),
    createdTo: z.coerce.date().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.createdFrom && value.createdTo && value.createdFrom > value.createdTo) {
      ctx.addIssue({
        code: "custom",
        path: ["createdTo"],
        message: "createdTo must be on or after createdFrom.",
      });
    }
  });

export const publicEventBySlugSchema = z.object({
  locale: localeSchema,
  slug: z.string().min(1).max(160),
});

/** Draft translations may be incomplete; publish rules enforced in the service. */
export const eventTranslationInputSchema = z.object({
  locale: localeSchema,
  title: z.string().max(300).default(""),
  subtitle: z.string().max(500).default(""),
  description: z.string().max(200_000).default(""),
});

export const createEventBodySchema = z.object({
  slug: eventSlugSchema.optional(),
  status: eventStatusSchema.default("DRAFT"),
  /**
   * Visitor-facing occurrence date (distinct from createdAt).
   * Required at the DB layer; drafts may still omit translations/media.
   * Stored as a UTC calendar date (see `src/lib/dates.ts`).
   */
  eventDate: z.coerce.date(),
  mainImageId: z.string().cuid().nullable().optional(),
  youtubeUrl: optionalYoutubeUrlSchema,
  galleryImageIds: z
    .array(z.string().cuid())
    .max(MEDIA_LIMITS.maxImagesPerItem)
    .optional()
    .default([]),
  translations: z.array(eventTranslationInputSchema).min(1).max(2),
  featureOnHomepage: z.boolean().optional().default(false),
});

/**
 * Slug and createdAt are immutable after creation.
 * Gallery max is a parse ceiling only; service enforces maxImagesPerItem with
 * grandfathering for existing over-limit records.
 */
export const updateEventBodySchema = z.object({
  status: eventStatusSchema.optional(),
  eventDate: z.coerce.date().optional(),
  mainImageId: z.string().cuid().nullable().optional(),
  youtubeUrl: optionalYoutubeUrlSchema,
  galleryImageIds: z
    .array(z.string().cuid())
    .max(GALLERY_IDS_UPDATE_CEILING)
    .optional(),
  translations: z.array(eventTranslationInputSchema).min(1).max(2).optional(),
  featureOnHomepage: z.boolean().optional(),
});

export const adminEventListQuerySchema = paginationSchema
  .merge(optionalSearchSchema)
  .extend({
    status: eventStatusSchema.optional(),
    locale: localeSchema.optional().default("ar"),
    /** Creation-date range filter (record createdAt), not eventDate. */
    createdFrom: z.coerce.date().optional(),
    createdTo: z.coerce.date().optional(),
    sort: z
      .enum(["createdAt_desc", "createdAt_asc", "eventDate_desc"])
      .optional()
      .default("createdAt_desc"),
  })
  .superRefine((value, ctx) => {
    if (value.createdFrom && value.createdTo && value.createdFrom > value.createdTo) {
      ctx.addIssue({
        code: "custom",
        path: ["createdTo"],
        message: "createdTo must be on or after createdFrom.",
      });
    }
  });

/** @deprecated Prefer createEventBodySchema */
export const createEventSchema = createEventBodySchema;
/** @deprecated Prefer updateEventBodySchema */
export const updateEventSchema = updateEventBodySchema.extend({
  id: z.string().cuid(),
});

export type PublicEventListQuery = z.infer<typeof publicEventListQuerySchema>;
export type CreateEventBody = z.infer<typeof createEventBodySchema>;
export type UpdateEventBody = z.infer<typeof updateEventBodySchema>;
export type AdminEventListQuery = z.infer<typeof adminEventListQuerySchema>;
