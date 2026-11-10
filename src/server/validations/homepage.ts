import { z } from "zod";

function noDuplicateIds(
  ids: string[],
  label: string,
  ctx: z.RefinementCtx,
) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      ctx.addIssue({
        code: "custom",
        message: `Duplicate ${label} IDs are not allowed.`,
      });
      return;
    }
    seen.add(id);
  }
}

export const featuredPublicationOrderSchema = z.object({
  publicationIds: z.array(z.string().cuid()).superRefine((ids, ctx) => {
    noDuplicateIds(ids, "publication", ctx);
  }),
});

/** Max three events — also enforced inside a transaction in the service. */
export const featuredEventOrderSchema = z.object({
  eventIds: z
    .array(z.string().cuid())
    .max(3)
    .superRefine((ids, ctx) => {
      noDuplicateIds(ids, "event", ctx);
    }),
});

export const homepageSelectionSchema = z.object({
  featuredPublications: featuredPublicationOrderSchema,
  featuredEvents: featuredEventOrderSchema,
});

/** Publication-only homepage selection — does not touch event selections. */
export const featuredPublicationsOnlySchema = featuredPublicationOrderSchema;

/** Event-only homepage selection — does not touch publication selections. */
export const featuredEventsOnlySchema = featuredEventOrderSchema;

/**
 * Partial homepage update: omitted sections are preserved.
 * At least one of featuredPublications / featuredEvents must be present.
 * Back-compat root keys: publicationIds / eventIds.
 */
export const homepageSelectionPatchSchema = z
  .object({
    featuredPublications: featuredPublicationOrderSchema.optional(),
    featuredEvents: featuredEventOrderSchema.optional(),
    publicationIds: z.array(z.string().cuid()).optional(),
    eventIds: z.array(z.string().cuid()).max(3).optional(),
  })
  .superRefine((raw, ctx) => {
    const hasPubs =
      raw.featuredPublications != null || raw.publicationIds != null;
    const hasEvents = raw.featuredEvents != null || raw.eventIds != null;
    if (!hasPubs && !hasEvents) {
      ctx.addIssue({
        code: "custom",
        message:
          "Provide featuredPublications and/or featuredEvents (omitted sections are preserved).",
      });
    }
    if (raw.publicationIds) {
      noDuplicateIds(raw.publicationIds, "publication", ctx);
    }
    if (raw.eventIds) {
      noDuplicateIds(raw.eventIds, "event", ctx);
    }
  })
  .transform((raw) => {
    const featuredPublications =
      raw.featuredPublications ??
      (raw.publicationIds
        ? { publicationIds: raw.publicationIds }
        : undefined);
    const featuredEvents =
      raw.featuredEvents ??
      (raw.eventIds ? { eventIds: raw.eventIds } : undefined);
    return { featuredPublications, featuredEvents };
  });

export type HomepageSelectionInput = z.infer<typeof homepageSelectionSchema>;
export type FeaturedPublicationsInput = z.infer<
  typeof featuredPublicationsOnlySchema
>;
export type FeaturedEventsInput = z.infer<typeof featuredEventsOnlySchema>;
export type HomepageSelectionPatch = z.infer<typeof homepageSelectionPatchSchema>;
