import { describe, expect, it } from "vitest";

import { INVALID_CREDENTIALS_MESSAGE } from "@/server/auth/types";

describe("credential error message", () => {
  it("uses one generic message for unknown and wrong password cases", () => {
    expect(INVALID_CREDENTIALS_MESSAGE).toBe("Invalid email or password.");
  });
});
