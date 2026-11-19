import { describe, expect, it } from "vitest";

import {
  MAX_PUBLICATION_AUTHORS,
  normalizeAuthorWriterIds,
} from "@/lib/publications/authors";
import {
  createPublicationBodySchema,
  updatePublicationBodySchema,
} from "@/server/validations/publications";

const categoryId = "cpubcat000000000000000001";
const writerA = "clxxxxxxxxxxxxxxxxxxxxxx1";
const writerB = "clxxxxxxxxxxxxxxxxxxxxxx2";

describe("publication multi-author validation", () => {
  it("accepts an ordered authorWriterIds array on create", () => {
    const parsed = createPublicationBodySchema.parse({
      categoryId,
      status: "DRAFT",
      authorWriterIds: [writerA, writerB],
      translations: [
        { locale: "en", title: "Report", subtitle: "", description: "" },
      ],
    });
    expect(parsed.authorWriterIds).toEqual([writerA, writerB]);
  });

  it("defaults authorWriterIds to an empty array", () => {
    const parsed = createPublicationBodySchema.parse({
      categoryId,
      status: "DRAFT",
      translations: [{ locale: "en", title: "Hello" }],
    });
    expect(parsed.authorWriterIds).toEqual([]);
  });

  it("rejects more than 10 authors", () => {
    const ids = Array.from({ length: MAX_PUBLICATION_AUTHORS + 1 }, (_, i) => {
      const n = String(i + 1).padStart(1, "0");
      return `clxxxxxxxxxxxxxxxxxxxxx${n}`.slice(0, 25);
    });
    // Ensure cuid-looking length: use fixed valid-ish ids
    const tooMany = Array.from(
      { length: 11 },
      (_, i) => `clxxxxxxxxxxxxxxxxxxxxx${i.toString(16)}`.padEnd(25, "0").slice(0, 25),
    );
    const result = createPublicationBodySchema.safeParse({
      categoryId,
      authorWriterIds: tooMany,
      translations: [{ locale: "en", title: "Too many" }],
    });
    expect(result.success).toBe(false);
    void ids;
  });

  it("rejects duplicate author ids", () => {
    const result = createPublicationBodySchema.safeParse({
      categoryId,
      authorWriterIds: [writerA, writerA],
      translations: [{ locale: "en", title: "Dup" }],
    });
    expect(result.success).toBe(false);
  });

  it("allows clearing authors on update with an empty array", () => {
    const parsed = updatePublicationBodySchema.parse({
      authorWriterIds: [],
    });
    expect(parsed.authorWriterIds).toEqual([]);
  });

  it("normalizeAuthorWriterIds drops duplicates and caps at max", () => {
    const many = Array.from(
      { length: 12 },
      (_, i) => `id-${i}`,
    );
    many.splice(2, 0, "id-1");
    expect(normalizeAuthorWriterIds(many)).toHaveLength(MAX_PUBLICATION_AUTHORS);
    expect(normalizeAuthorWriterIds(["a", "a", "b"])).toEqual(["a", "b"]);
  });
});
