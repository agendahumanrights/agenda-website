import "server-only";

import { SESSION_TTL_SECONDS } from "@/server/auth/types";

export type SessionCookieOptions = {
  httpOnly: boolean;
  sameSite: "lax";
  path: string;
  secure: boolean;
  maxAge: number;
};

export function getSessionCookieName(): string {
  return process.env.ADMIN_SESSION_COOKIE_NAME?.trim() || "agenda_admin_session";
}

export function sessionCookieOptions(
  maxAgeSeconds: number = SESSION_TTL_SECONDS,
): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: maxAgeSeconds,
  };
}

/** Options used when clearing the cookie — must match set attributes. */
export function clearSessionCookieOptions(): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  };
}
