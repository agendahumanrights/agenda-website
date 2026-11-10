/**
 * Admin authentication contract.
 */

export type AdminSession = {
  userId: string;
  email: string;
  name: string | null;
};

export type AuthResult =
  | { authenticated: true; session: AdminSession }
  | {
      authenticated: false;
      reason: "UNAUTHENTICATED" | "DATABASE_UNAVAILABLE";
    };

/** Generic message for unknown email and wrong password (no account enumeration). */
export const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const LOGIN_THROTTLE = {
  maxFailures: 5,
  windowMs: 15 * 60 * 1000,
} as const;
