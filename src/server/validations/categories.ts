import { z } from "zod";

import {
  localeSchema,
  optionalSearchSchema,
  paginationSchema,
} from "@/server/validations/common";

const categoryNameSchema = z
  .string()
  .trim()
  .min(1, "Category name is required.")
  .max(80, "Category name must be at most 80 characters.");

export const createPublicationCategoryBodySchema = z.object({
  nameEn: categoryNameSchema,
  nameAr: categoryNameSchema,
});

export const updatePublicationCategoryBodySchema = z.object({
  nameEn: categoryNameSchema.optional(),
  nameAr: categoryNameSchema.optional(),
});

export const adminPublicationCategoryListQuerySchema = paginationSchema
  .merge(optionalSearchSchema)
  .extend({
    locale: localeSchema.optional().default("ar"),
  });

export type CreatePublicationCategoryBody = z.infer<
  typeof createPublicationCategoryBodySchema
>;
export type UpdatePublicationCategoryBody = z.infer<
  typeof updatePublicationCategoryBodySchema
>;
export type AdminPublicationCategoryListQuery = z.infer<
  typeof adminPublicationCategoryListQuerySchema
>;
