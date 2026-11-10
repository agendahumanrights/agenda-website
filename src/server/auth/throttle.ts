import "server-only";

import { getPrisma, isDatabaseConfigured } from "@/server/db";
import { tooManyRequests, serviceUnavailable } from "@/server/http/errors";
import { LOGIN_THROTTLE } from "@/server/auth/types";

export function emailThrottleKey(normalizedEmail: string): string {
  return `email:${normalizedEmail}`;
}

export function ipThrottleKey(ip: string): string {
  return `ip:${ip}`;
}

/**
 * Resolve client IP for throttling.
 * Only trusts X-Forwarded-For when TRUST_PROXY=true (document reverse-proxy setup).
 */
export function resolveClientIp(request: Request): string | null {
  if (process.env.TRUST_PROXY === "true") {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first;
    }
  }
  // Next.js / undici may not expose remoteAddress on Request; use a stable bucket.
  return request.headers.get("x-real-ip")?.trim() || null;
}

export function isWindowExpired(
  windowStartedAt: Date,
  now: Date,
  windowMs: number = LOGIN_THROTTLE.windowMs,
): boolean {
  return now.getTime() - windowStartedAt.getTime() >= windowMs;
}

export async function assertNotThrottled(keys: string[]): Promise<void> {
  if (!isDatabaseConfigured()) {
    throw serviceUnavailable("Authentication is temporarily unavailable.");
  }
  if (keys.length === 0) return;

  const prisma = getPrisma();
  const now = new Date();
  const rows = await prisma.loginThrottle.findMany({
    where: { key: { in: keys } },
  });

  for (const row of rows) {
    if (row.blockedUntil && row.blockedUntil > now) {
      throw tooManyRequests("Too many login attempts. Try again later.");
    }
    if (
      !isWindowExpired(row.windowStartedAt, now) &&
      row.failedCount >= LOGIN_THROTTLE.maxFailures
    ) {
      throw tooManyRequests("Too many login attempts. Try again later.");
    }
  }
}

export async function recordLoginFailure(keys: string[]): Promise<void> {
  if (!isDatabaseConfigured() || keys.length === 0) return;

  const prisma = getPrisma();
  const now = new Date();

  for (const key of keys) {
    const existing = await prisma.loginThrottle.findUnique({ where: { key } });
    if (!existing || isWindowExpired(existing.windowStartedAt, now)) {
      const blockedUntil =
        LOGIN_THROTTLE.maxFailures <= 1
          ? new Date(now.getTime() + LOGIN_THROTTLE.windowMs)
          : null;
      await prisma.loginThrottle.upsert({
        where: { key },
        create: {
          key,
          failedCount: 1,
          windowStartedAt: now,
          blockedUntil,
        },
        update: {
          failedCount: 1,
          windowStartedAt: now,
          blockedUntil,
        },
      });
      continue;
    }

    const failedCount = existing.failedCount + 1;
    const blockedUntil =
      failedCount >= LOGIN_THROTTLE.maxFailures
        ? new Date(now.getTime() + LOGIN_THROTTLE.windowMs)
        : existing.blockedUntil;

    await prisma.loginThrottle.update({
      where: { key },
      data: { failedCount, blockedUntil },
    });
  }
}

export async function clearLoginFailures(keys: string[]): Promise<void> {
  if (!isDatabaseConfigured() || keys.length === 0) return;
  const prisma = getPrisma();
  await prisma.loginThrottle.deleteMany({ where: { key: { in: keys } } });
}
