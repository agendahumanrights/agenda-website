import { describe, expect, it } from "vitest";

import {
  hashPassword,
  normalizeEmail,
  verifyPassword,
} from "@/server/auth/password";

describe("password hashing", () => {
  it("normalizes email", () => {
    expect(normalizeEmail("  Admin@Example.COM ")).toBe("admin@example.com");
  });

  it("hashes and verifies passwords without storing plaintext", async () => {
    const password = "123Admin.";
    const hashed = await hashPassword(password);
    expect(hashed).not.toContain(password);
    expect(await verifyPassword(hashed, password)).toBe(true);
    expect(await verifyPassword(hashed, "wrong")).toBe(false);
  });
});
