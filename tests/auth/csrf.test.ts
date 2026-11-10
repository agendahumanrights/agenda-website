import { describe, expect, it } from "vitest";

import { isTrustedOrigin } from "@/server/auth/csrf";

describe("isTrustedOrigin", () => {
  const trusted = ["http://localhost:3000", "https://humanrightsagenda.org"];

  it("accepts listed origins", () => {
    expect(isTrustedOrigin("http://localhost:3000", trusted)).toBe(true);
  });

  it("rejects missing or foreign origins", () => {
    expect(isTrustedOrigin(null, trusted)).toBe(false);
    expect(isTrustedOrigin("https://evil.example", trusted)).toBe(false);
  });
});
