import "server-only";

import { forbidden } from "@/server/http/errors";

function configuredOrigins(): string[] {
  const origins = new Set<string>();
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    try {
      origins.add(new URL(site).origin);
    } catch {
      // ignore invalid URL
    }
  }
  const extra = process.env.AUTH_TRUSTED_ORIGINS?.split(",") ?? [];
  for (const raw of extra) {
    const value = raw.trim();
    if (!value) continue;
    try {
      origins.add(new URL(value).origin);
    } catch {
      // ignore
    }
  }
  // Local development defaults when NEXT_PUBLIC_SITE_URL is unset
  if (origins.size === 0) {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
  }
  return [...origins];
}

function originFromReferer(referer: string | null): string | null {
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

/**
 * Same-origin check for cookie-authenticated mutations (login/logout).
 * Prefers Origin; falls back to Referer. Does not trust arbitrary clients.
 */
export function assertSameOrigin(request: Request): void {
  const trusted = configuredOrigins();
  const origin = request.headers.get("origin");
  const candidate =
    origin && origin !== "null"
      ? origin
      : originFromReferer(request.headers.get("referer"));

  if (!candidate || !trusted.includes(candidate)) {
    throw forbidden("Invalid request origin.");
  }
}

/** Pure helper for unit tests. */
export function isTrustedOrigin(
  origin: string | null,
  trustedOrigins: string[],
): boolean {
  return Boolean(origin && trustedOrigins.includes(origin));
}
