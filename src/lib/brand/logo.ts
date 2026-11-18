import type { Locale } from "@/i18n/config";

/**
 * Locale-specific Agenda lockups under `public/images/`.
 * Prefer `organizationLogoPath(locale)` in UI; keep the unprefixed EN file
 * only as a legacy/SEO fallback path.
 */
export const ORGANIZATION_LOGO_PATHS = {
  en: "/images/agenda-logo-en.png",
  ar: "/images/agenda-logo-ar.png",
} as const satisfies Record<Locale, string>;

/** Intrinsic pixel size shared by both lockup PNGs (for next/image). */
export const ORGANIZATION_LOGO_SIZE = {
  width: 2480,
  height: 2338,
} as const;

export function organizationLogoPath(locale: Locale): string {
  return ORGANIZATION_LOGO_PATHS[locale];
}

/** Filesystem path relative to the repo root (OG ImageResponse, etc.). */
export function organizationLogoFsPath(locale: Locale = "en"): string {
  return `public/images/agenda-logo-${locale}.png`;
}
