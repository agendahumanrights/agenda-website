import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth", () => ({
  assertSameOrigin: vi.fn(),
}));

vi.mock("@/server/services/newsletter-throttle", () => ({
  newsletterThrottleKeys: vi.fn(() => ["newsletter:email:a@b.co"]),
  assertNewsletterNotThrottled: vi.fn(),
  recordNewsletterAttempt: vi.fn(),
}));

vi.mock("@/server/services/newsletter", () => ({
  subscribeToNewsletter: vi.fn(),
}));

describe("POST /api/newsletter/subscribe", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns subscribed for honeypot submissions without calling the service", async () => {
    const { subscribeToNewsletter } = await import(
      "@/server/services/newsletter"
    );
    const { POST } = await import("@/app/api/newsletter/subscribe/route");

    const res = await POST(
      new Request("http://localhost:3000/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          email: "bot@example.com",
          website: "http://spam.test",
        }),
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ outcome: "subscribed" });
    expect(subscribeToNewsletter).not.toHaveBeenCalled();
  });

  it("creates a subscription for a valid email", async () => {
    const { subscribeToNewsletter } = await import(
      "@/server/services/newsletter"
    );
    vi.mocked(subscribeToNewsletter).mockResolvedValue({
      outcome: "subscribed",
    });
    const { POST } = await import("@/app/api/newsletter/subscribe/route");

    const res = await POST(
      new Request("http://localhost:3000/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ email: "person@example.com", website: "" }),
      }),
    );

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ outcome: "subscribed" });
    expect(subscribeToNewsletter).toHaveBeenCalledWith(
      "person@example.com",
      "en",
    );
  });

  it("returns already_subscribed without creating duplicates", async () => {
    const { subscribeToNewsletter } = await import(
      "@/server/services/newsletter"
    );
    vi.mocked(subscribeToNewsletter).mockResolvedValue({
      outcome: "already_subscribed",
    });
    const { POST } = await import("@/app/api/newsletter/subscribe/route");

    const res = await POST(
      new Request("http://localhost:3000/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
        },
        body: JSON.stringify({ email: "person@example.com" }),
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      outcome: "already_subscribed",
    });
  });
});
