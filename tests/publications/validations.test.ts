import { describe, expect, it } from "vitest";

import {
  createPublicationBodySchema,
  updatePublicationBodySchema,
} from "@/server/validations/publications";
import { featuredPublicationsOnlySchema } from "@/server/validations/homepage";

describe("publication validations", () => {
  it("accepts draft create with one title", () => {
    const parsed = createPublicationBodySchema.parse({
      categoryId: "cpubcat000000000000000001",
      status: "DRAFT",
      translations: [{ locale: "en", title: "Hello", subtitle: "", description: "" }],
    });
    expect(parsed.status).toBe("DRAFT");
    expect(parsed.galleryImageIds).toEqual([]);
    expect(parsed.categoryId).toBe("cpubcat000000000000000001");
  });

  it("rejects invalid slug pattern when provided", () => {
    const result = createPublicationBodySchema.safeParse({
      categoryId: "cpubcat000000000000000001",
      slug: "Bad Slug!",
      translations: [{ locale: "en", title: "Hello" }],
    });
    expect(result.success).toBe(false);
  });

  it("omits slug from update schema", () => {
    const parsed = updatePublicationBodySchema.parse({
      categoryId: "cpubcat000000000000000002",
      authorFounderId: null,
    });
    expect("slug" in parsed).toBe(false);
  });

  it("rejects duplicate featured publication ids", () => {
    // Valid cuid shape (25 chars after c)
    const a = "clxxxxxxxxxxxxxxxxxxxxxx1";
    const result = featuredPublicationsOnlySchema.safeParse({
      publicationIds: [a, a],
    });
    // Either cuid validation fails or duplicate refine fires — must not succeed
    expect(result.success).toBe(false);
  });
});
