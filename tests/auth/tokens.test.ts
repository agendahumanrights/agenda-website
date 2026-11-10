import { describe, expect, it } from "vitest";

import { createSessionToken, hashSessionToken } from "@/server/auth/tokens";

describe("session tokens", () => {
  it("creates unique opaque tokens and stable hashes", () => {
    const a = createSessionToken();
    const b = createSessionToken();
    expect(a).not.toBe(b);
    expect(hashSessionToken(a)).toHaveLength(64);
    expect(hashSessionToken(a)).toBe(hashSessionToken(a));
    expect(hashSessionToken(a)).not.toBe(hashSessionToken(b));
  });
});
