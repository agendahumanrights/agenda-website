import { describe, expect, it } from "vitest";

import {
  createPublicationCategoryBodySchema,
  updatePublicationCategoryBodySchema,
} from "@/server/validations/categories";
import { createPublicationBodySchema } from "@/server/validations/publications";

describe("publication category validations", () => {
  it("requires bilingual names on create", () => {
    expect(
      createPublicationCategoryBodySchema.safeParse({
        nameEn: "Research",
        nameAr: "",
      }).success,
    ).toBe(false);
    expect(
      createPublicationCategoryBodySchema.parse({
        nameEn: "  Research  ",
        nameAr: "  أبحاث  ",
      }),
    ).toEqual({ nameEn: "Research", nameAr: "أبحاث" });
  });

  it("allows partial updates", () => {
    expect(
      updatePublicationCategoryBodySchema.parse({ nameEn: "Reports" }),
    ).toEqual({ nameEn: "Reports" });
  });

  it("requires categoryId cuid on publication create", () => {
    expect(
      createPublicationBodySchema.safeParse({
        translations: [{ locale: "en", title: "Hello" }],
      }).success,
    ).toBe(false);
  });
});
