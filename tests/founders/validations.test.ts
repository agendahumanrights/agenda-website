import { describe, expect, it } from "vitest";

import {
  createFounderBodySchema,
  reorderFoundersBodySchema,
  updateFounderBodySchema,
} from "@/server/validations/founders";

describe("founder validations", () => {
  const translations = [
    {
      locale: "ar" as const,
      fullName: "اسم",
      professionalArea: "مجال",
      biography: "سيرة",
    },
    {
      locale: "en" as const,
      fullName: "Name",
      professionalArea: "Area",
      biography: "Bio",
    },
  ];

  it("requires email, image, and both locales on create", () => {
    const parsed = createFounderBodySchema.parse({
      email: "founder@example.com",
      profileImageId: "clxxxxxxxxxxxxxxxxxxxxxx1",
      translations,
    });
    expect(parsed.email).toBe("founder@example.com");
  });

  it("rejects create without both locales", () => {
    const result = createFounderBodySchema.safeParse({
      email: "founder@example.com",
      profileImageId: "clxxxxxxxxxxxxxxxxxxxxxx1",
      translations: [translations[0]],
    });
    expect(result.success).toBe(false);
  });

  it("omits bioKey from update schema", () => {
    const parsed = updateFounderBodySchema.parse({
      email: "a@b.co",
      translations,
    });
    expect("bioKey" in parsed).toBe(false);
  });

  it("rejects duplicate reorder IDs", () => {
    const a = "clxxxxxxxxxxxxxxxxxxxxxx1";
    const result = reorderFoundersBodySchema.safeParse({
      founderIds: [a, a],
    });
    expect(result.success).toBe(false);
  });
});
