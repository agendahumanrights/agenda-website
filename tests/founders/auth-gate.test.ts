import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/server/auth", () => ({
  requireAdminSession: vi.fn(async () => {
    const { unauthorized } = await import("@/server/http/errors");
    throw unauthorized();
  }),
  assertSameOrigin: vi.fn(),
  getAdminSession: vi.fn(async () => ({
    authenticated: false as const,
    reason: "NO_COOKIE",
  })),
}));

describe("admin founders auth gate", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("GET /api/admin/founders returns 401 without session", async () => {
    const { GET } = await import("@/app/api/admin/founders/route");
    const res = await GET(
      new Request("http://localhost:3000/api/admin/founders"),
    );
    expect(res.status).toBe(401);
  });

  it("PUT /api/admin/founders/reorder returns 401 without session", async () => {
    const { PUT } = await import("@/app/api/admin/founders/reorder/route");
    const res = await PUT(
      new Request("http://localhost:3000/api/admin/founders/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ founderIds: [] }),
      }),
    );
    expect(res.status).toBe(401);
  });
});
