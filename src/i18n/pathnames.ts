import type { Locale } from "@/i18n/config";
import {
  LANG_QUERY_PARAM,
  localizedHref,
  URL_DEFAULT_LOCALE,
} from "@/lib/seo/locale-url";

/**
 * Site paths are unprefixed (no `/ar` or `/en`).
 * Language for SEO uses `?lang=ar` (English is unmarked).
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

/**
 * Strip a legacy `/ar` or `/en` prefix from a pathname.
 * Used by the Proxy when redirecting old prefixed URLs.
 */
export function stripLocalePrefix(pathname: string): {
  locale: "ar" | "en" | null;
  pathname: string;
} {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) {
    return { locale: null, pathname: "/" };
  }
  const maybe = parts[0];
  if (maybe === "ar" || maybe === "en") {
    const rest = parts.slice(1).join("/");
    return { locale: maybe, pathname: rest ? `/${rest}` : "/" };
  }
  return {
    locale: null,
    pathname: pathname.startsWith("/") ? pathname : `/${pathname}`,
  };
}

export { LANG_QUERY_PARAM, URL_DEFAULT_LOCALE };
