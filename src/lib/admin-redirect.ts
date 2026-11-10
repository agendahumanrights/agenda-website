/**
 * Client-safe redirect validation (mirrors server `safeAdminNextPath`).
 * Keep in sync with `src/server/auth/redirects.ts`.
 */
const DEFAULT_ADMIN_DESTINATION = "/admin";

export function safeAdminNextPath(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_ADMIN_DESTINATION;

  const path = raw;

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) {
    return DEFAULT_ADMIN_DESTINATION;
  }

  if (!path.startsWith("/") || path.startsWith("//")) {
    return DEFAULT_ADMIN_DESTINATION;
  }

  const pathOnly = path.split(/[?#]/)[0] ?? path;

  if (!pathOnly.startsWith("/admin")) {
    return DEFAULT_ADMIN_DESTINATION;
  }

  if (pathOnly === "/admin/login" || pathOnly.startsWith("/admin/login/")) {
    return DEFAULT_ADMIN_DESTINATION;
  }

  return path;
}

export { DEFAULT_ADMIN_DESTINATION };
