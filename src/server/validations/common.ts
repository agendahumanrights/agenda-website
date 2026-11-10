import { z } from "zod";

export const localeSchema = z.enum(["ar", "en"]);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export const optionalSearchSchema = z.object({
  q: z.string().trim().max(200).optional(),
});

/** Public catalogue date sort (admin-selected dates, not createdAt). */
export const catalogueDateSortSchema = z
  .enum(["newest", "oldest"])
  .optional()
  .default("newest");

export type CatalogueDateSortInput = z.infer<typeof catalogueDateSortSchema>;

export type PaginationInput = z.infer<typeof paginationSchema>;
