import { describe, expect, it } from "vitest";

import { slugify } from "@/lib/slugs";

describe("slugify", () => {
  it("produces URL-safe lowercase slugs", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
  });

  it("keeps Arabic letters", () => {
    const result = slugify("حقوق الإنسان");
    expect(result.length).toBeGreaterThan(0);
    expect(result.includes(" ")).toBe(false);
  });

  it("returns empty for punctuation-only input", () => {
    expect(slugify("!!!")).toBe("");
  });
});
