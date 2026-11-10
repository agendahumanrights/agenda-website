/** Production origin used when env is unset or points at localhost in production builds. */
export const PRODUCTION_SITE_URL = "https://humanrightsagenda.org";

/**
 * Canonical site origin (no trailing slash).
 * Prefers `NEXT_PUBLIC_SITE_URL`; falls back to the production domain.
 * Rejects empty/invalid values so metadata never emits relative or localhost
 * URLs when a real public origin is required.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      const url = new URL(raw);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.origin;
      }
    } catch {
      // fall through
    }
  }
  return PRODUCTION_SITE_URL;
}

/** True when this deployment should stay out of search indexes. */
export function isNonProductionIndexing(): boolean {
  if (process.env.SEO_NOINDEX === "1" || process.env.SEO_NOINDEX === "true") {
    return true;
  }
  const site = getSiteUrl();
  if (/localhost|127\.0\.0\.1/i.test(site)) return true;
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv && vercelEnv !== "production") return true;
  return false;
}

/** Join origin + path/query into an absolute URL. */
export function absoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return getSiteUrl();
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${getSiteUrl()}${path}`;
}
