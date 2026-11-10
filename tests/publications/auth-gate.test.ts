import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/server/auth", () => ({
  requireAdminSession: vi.fn(async () => {
    const { unauthorized } = await import("@/server/http/errors");
    throw unauthorized();
  }),
  assertSameOrigin: vi.fn(),
  getAdminSession: vi.fn(async () => ({ authenticated: false as const, reason: "NO_COOKIE" })),
}));

describe("admin publications auth gate", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("GET /api/admin/publications returns 401 without session", async () => {
    const { GET } = await import("@/app/api/admin/publications/route");
    const res = await GET(new Request("http://localhost:3000/api/admin/publications"));
    expect(res.status).toBe(401);
  });

  it("POST /api/admin/publications returns 401 without session", async () => {
    const { POST } = await import("@/app/api/admin/publications/route");
    const res = await POST(
      new Request("http://localhost:3000/api/admin/publications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("POST /api/admin/media/upload returns 401 without session", async () => {
    const { POST } = await import("@/app/api/admin/media/upload/route");
    const res = await POST(
      new Request("http://localhost:3000/api/admin/media/upload", {
        method: "POST",
        body: new FormData(),
      }),
    );
    expect(res.status).toBe(401);
  });
});
