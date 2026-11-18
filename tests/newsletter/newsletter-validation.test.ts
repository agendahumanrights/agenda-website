import { describe, expect, it } from "vitest";

import { newsletterSubscribeSchema } from "@/server/validations/newsletter";

describe("newsletterSubscribeSchema", () => {
  it("accepts a valid email, locale, and empty honeypot", () => {
    const parsed = newsletterSubscribeSchema.parse({
      email: "  Subscriber@Example.COM ",
      locale: "ar",
      website: "",
    });
    expect(parsed.email).toBe("Subscriber@Example.COM");
    expect(parsed.locale).toBe("ar");
    expect(parsed.website).toBe("");
  });

  it("defaults locale to en", () => {
    expect(newsletterSubscribeSchema.parse({ email: "a@b.co" }).locale).toBe(
      "en",
    );
  });

  it("rejects invalid emails", () => {
    expect(() =>
      newsletterSubscribeSchema.parse({ email: "not-an-email" }),
    ).toThrow();
    expect(() => newsletterSubscribeSchema.parse({ email: "" })).toThrow();
  });

  it("allows honeypot text so the route can silently ignore bots", () => {
    const parsed = newsletterSubscribeSchema.parse({
      email: "bot@example.com",
      website: "https://spam.example",
    });
    expect(parsed.website).toBe("https://spam.example");
  });
});
