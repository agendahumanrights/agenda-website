import { describe, expect, it } from "vitest";

import {
  createWriterBodySchema,
  updateWriterBodySchema,
  writerSocialLinksSchema,
} from "@/server/validations/writers";

describe("writer validations", () => {
  it("requires ar+en fullName, major, and biography on create", () => {
    const parsed = createWriterBodySchema.parse({
      email: "writer@example.com",
      profileImageId: "clxxxxxxxxxxxxxxxxxxxxxx1",
      socialLinks: [{ platform: "linkedin", url: "https://linkedin.com/in/a" }],
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
    expect(parsed.socialLinks).toHaveLength(1);
    expect(parsed.translations[0]?.biography).toBe("سيرة عربية");
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

  it("rejects duplicate social platforms", () => {
    const result = writerSocialLinksSchema.safeParse([
      { platform: "x", url: "https://x.com/a" },
      { platform: "x", url: "https://x.com/b" },
    ]);
    expect(result.success).toBe(false);
  });

  it("omits slug from update schema", () => {
    const parsed = updateWriterBodySchema.parse({
      email: "writer@example.com",
      socialLinks: [],
    });
    expect("slug" in parsed).toBe(false);
  });
});
