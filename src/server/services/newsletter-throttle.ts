import "server-only";

import { normalizeEmail } from "@/server/auth/password";
import {
  ipThrottleKey,
  isWindowExpired,
  resolveClientIp,
} from "@/server/auth/throttle";
import { getPrisma, isDatabaseConfigured } from "@/server/db";
import { serviceUnavailable, tooManyRequests } from "@/server/http/errors";

/** Public subscribe rate limits (rows stored in LoginThrottle with newsletter: prefix). */
export const NEWSLETTER_THROTTLE = {
  maxAttempts: 8,
  windowMs: 60 * 60 * 1000,
} as const;

export function newsletterEmailThrottleKey(email: string): string {
  return `newsletter:email:${normalizeEmail(email)}`;
}

export function newsletterIpThrottleKey(ip: string): string {
  return `newsletter:${ipThrottleKey(ip)}`;
}

export function newsletterThrottleKeys(
  request: Request,
  email: string,
): string[] {
  const keys = [newsletterEmailThrottleKey(email)];
  const ip = resolveClientIp(request);
  if (ip) keys.push(newsletterIpThrottleKey(ip));
  return keys;
}

export async function assertNewsletterNotThrottled(
  keys: string[],
): Promise<void> {
  if (!isDatabaseConfigured()) {
    throw serviceUnavailable("Newsletter is temporarily unavailable.");
  }
  if (keys.length === 0) return;

  const prisma = getPrisma();
  const now = new Date();
  const rows = await prisma.loginThrottle.findMany({
    where: { key: { in: keys } },
  });

  for (const row of rows) {
    if (row.blockedUntil && row.blockedUntil > now) {
      throw tooManyRequests(
        "Too many subscription attempts. Please try again later.",
      );
    }
    if (
      !isWindowExpired(row.windowStartedAt, now, NEWSLETTER_THROTTLE.windowMs) &&
      row.failedCount >= NEWSLETTER_THROTTLE.maxAttempts
    ) {
      throw tooManyRequests(
        "Too many subscription attempts. Please try again later.",
      );
    }
  }
}

/** Count every subscribe attempt (including honeypot / invalid) toward the window. */
export async function recordNewsletterAttempt(keys: string[]): Promise<void> {
  if (!isDatabaseConfigured() || keys.length === 0) return;

  const prisma = getPrisma();
  const now = new Date();

  for (const key of keys) {
    const existing = await prisma.loginThrottle.findUnique({ where: { key } });
    if (
      !existing ||
      isWindowExpired(
        existing.windowStartedAt,
        now,
        NEWSLETTER_THROTTLE.windowMs,
      )
    ) {
      const blockedUntil =
        NEWSLETTER_THROTTLE.maxAttempts <= 1
          ? new Date(now.getTime() + NEWSLETTER_THROTTLE.windowMs)
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
      failedCount >= NEWSLETTER_THROTTLE.maxAttempts
        ? new Date(now.getTime() + NEWSLETTER_THROTTLE.windowMs)
        : existing.blockedUntil;

    await prisma.loginThrottle.update({
      where: { key },
      data: { failedCount, blockedUntil },
    });
  }
}
