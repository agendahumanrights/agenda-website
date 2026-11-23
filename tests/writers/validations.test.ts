import { describe, expect, it } from "vitest";

import {
  createWriterBodySchema,
  updateWriterBodySchema,
  writerSocialLinksSchema,
} from "@/server/validations/writers";

describe("writer validations", () => {
  it("accepts create with optional email/major omitted or empty", () => {
    const parsed = createWriterBodySchema.parse({
      email: "",
      profileImageId: "clxxxxxxxxxxxxxxxxxxxxxx1",
      socialLinks: [{ platform: "linkedin", url: "https://linkedin.com/in/a" }],
      translations: [
        {
          locale: "ar",
          fullName: "كاتب",
          major: "",
          biography: "سيرة عربية",
        },
        {
          locale: "en",
          fullName: "Writer",
          biography: "English biography",
        },
      ],
    });
    expect(parsed.email).toBeNull();
    expect(parsed.translations[0]?.major).toBe("");
    expect(parsed.translations[1]?.major).toBe("");
    expect(parsed.socialLinks).toHaveLength(1);
  });

  it("accepts a valid optional email on create", () => {
    const parsed = createWriterBodySchema.parse({
      email: "writer@example.com",
      profileImageId: "clxxxxxxxxxxxxxxxxxxxxxx1",
      translations: [
        {
          locale: "ar",
          fullName: "كاتب",
          major: "باحث",
          biography: "سيرة عربية",
        },
        {
          locale: "en",
          fullName: "Writer",
          major: "Researcher",
          biography: "English biography",
        },
      ],
    });
    expect(parsed.email).toBe("writer@example.com");
  });

  it("rejects create translations without biography", () => {
    const result = createWriterBodySchema.safeParse({
      email: "writer@example.com",
      profileImageId: "clxxxxxxxxxxxxxxxxxxxxxx1",
      translations: [
        { locale: "ar", fullName: "كاتب", major: "باحث" },
        { locale: "en", fullName: "Writer", major: "Researcher" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email when provided", () => {
    const result = createWriterBodySchema.safeParse({
      email: "not-an-email",
      profileImageId: "clxxxxxxxxxxxxxxxxxxxxxx1",
      translations: [
        {
          locale: "ar",
          fullName: "كاتب",
          biography: "سيرة",
        },
        {
          locale: "en",
          fullName: "Writer",
          biography: "Bio",
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate social platforms", () => {
    const result = writerSocialLinksSchema.safeParse([
      { platform: "x", url: "https://x.com/a" },
      { platform: "x", url: "https://x.com/b" },
    ]);
    expect(result.success).toBe(false);
  });

  it("omits slug from update schema and allows clearing email", () => {
    const parsed = updateWriterBodySchema.parse({
      email: null,
      socialLinks: [],
    });
    expect("slug" in parsed).toBe(false);
    expect(parsed.email).toBeNull();
  });
});
