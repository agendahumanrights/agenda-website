import type { Locale } from "@/i18n/config";
import {
  LANG_QUERY_PARAM,
  localizedHref,
  stripLocalePrefix,
  URL_DEFAULT_LOCALE,
} from "@/lib/seo/locale-url";

/**
 * Site paths are language-aware:
 * - English: unmarked (`/publications`)
 * - Arabic: `/ar` prefix (`/ar/publications`)
 */

export function sitePath(path = "/", locale?: Locale): string {
  const normalized =
    !path || path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  if (!locale) return normalized;
  return localizedHref(normalized, locale);
}

/** @deprecated Prefer sitePath(path, locale). */
export function localizedPath(locale: string, path = "/"): string {
  const loc = locale === "ar" || locale === "en" ? locale : URL_DEFAULT_LOCALE;
  return sitePath(path === "" ? "/" : path, loc);
}

export { LANG_QUERY_PARAM, URL_DEFAULT_LOCALE, stripLocalePrefix };
