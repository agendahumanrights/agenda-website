import "server-only";

import { cookies } from "next/headers";
import { connection } from "next/server";

import {
  clearSessionCookieOptions,
  getSessionCookieName,
  sessionCookieOptions,
} from "@/server/auth/cookies";
import { hashSessionToken, createSessionToken } from "@/server/auth/tokens";
import type { AdminSession, AuthResult } from "@/server/auth/types";
import { SESSION_TTL_SECONDS } from "@/server/auth/types";
import { getPrisma, isDatabaseConfigured } from "@/server/db";
import { unauthorized, serviceUnavailable } from "@/server/http/errors";

export async function getAdminSession(): Promise<AuthResult> {
  if (!isDatabaseConfigured()) {
    return { authenticated: false, reason: "DATABASE_UNAVAILABLE" };
  }

  // Request-time boundary so session expiry checks using Date are not prerendered.
  await connection();

  const jar = await cookies();
  const token = jar.get(getSessionCookieName())?.value;
  if (!token) {
    return { authenticated: false, reason: "UNAUTHENTICATED" };
  }

  const tokenHash = hashSessionToken(token);
  const prisma = getPrisma();
  const now = new Date();

  const row = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { adminUser: true },
  });

  if (
    !row ||
    row.revokedAt ||
    row.expiresAt <= now ||
    !row.adminUser
  ) {
    return { authenticated: false, reason: "UNAUTHENTICATED" };
  }

  const session: AdminSession = {
    userId: row.adminUser.id,
    email: row.adminUser.email,
    name: row.adminUser.name,
  };

  return { authenticated: true, session };
}

export async function requireAdminSession(): Promise<AdminSession> {
  const result = await getAdminSession();
  if (!result.authenticated) {
    if (result.reason === "DATABASE_UNAVAILABLE") {
      throw serviceUnavailable("Authentication is temporarily unavailable.");
    }
    throw unauthorized("Unauthorized");
  }
  return result.session;
}

export async function createAdminSession(
  adminUserId: string,
): Promise<{ token: string; expiresAt: Date }> {
  if (!isDatabaseConfigured()) {
    throw serviceUnavailable("Authentication is temporarily unavailable.");
  }

  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const prisma = getPrisma();

  await prisma.adminSession.create({
    data: {
      adminUserId,
      tokenHash,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(getSessionCookieName(), token, sessionCookieOptions());
}

export async function revokeCurrentSession(): Promise<void> {
  if (!isDatabaseConfigured()) {
    await clearSessionCookie();
    return;
  }

  const jar = await cookies();
  const token = jar.get(getSessionCookieName())?.value;
  if (token) {
    const tokenHash = hashSessionToken(token);
    const prisma = getPrisma();
    await prisma.adminSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  await clearSessionCookie();
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(getSessionCookieName(), "", clearSessionCookieOptions());
}

/** @deprecated Auth is implemented; kept for any lingering callers. */
export function isAuthPending(): boolean {
  return false;
}
