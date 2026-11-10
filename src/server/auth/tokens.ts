import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32;

/** Cryptographically secure opaque session token (sent only in the cookie). */
export function createSessionToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/** SHA-256 hex digest for storage — never store the raw token. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
