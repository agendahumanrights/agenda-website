import { describe, expect, it } from "vitest";

import { isWindowExpired } from "@/server/auth/throttle";
import { LOGIN_THROTTLE } from "@/server/auth/types";

describe("login throttle window", () => {
  it("detects expired windows", () => {
    const started = new Date("2026-01-01T00:00:00.000Z");
    const inside = new Date(started.getTime() + LOGIN_THROTTLE.windowMs - 1000);
    const outside = new Date(started.getTime() + LOGIN_THROTTLE.windowMs + 1000);
    expect(isWindowExpired(started, inside)).toBe(false);
    expect(isWindowExpired(started, outside)).toBe(true);
  });
});
