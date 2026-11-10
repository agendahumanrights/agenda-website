import type { Locale } from "@/i18n/config";
import { absoluteUrl } from "@/lib/seo/site-url";

/**
 * Legacy crawlable language query (pre path-prefix). Still accepted by the
 * proxy, which redirects `?lang=ar` → `/ar/...` and strips `?lang=en`.
 */
export const LANG_QUERY_PARAM = "lang";

/**
 * Locale for unmarked public URLs (no `/ar` prefix).
 * Arabic uses the `/ar` path prefix. Matches Search Console / hreflang strategy.
 */
export const URL_DEFAULT_LOCALE: Locale = "en";

export function isLocaleQueryValue(
  value: string | null | undefined,
): value is Locale {
  return value === "ar" || value === "en";
}

/**
 * Strip a leading `/ar` or `/en` segment from a pathname.
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

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "") return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

/**
 * Build a site-relative href for a locale.
 * English is unmarked; Arabic uses `/ar` prefix. Other query params are preserved.
 * Legacy `lang` query values are never emitted.
 */
export function localizedHref(
  pathname: string,
  locale: Locale,
  searchParams?: URLSearchParams | Record<string, string | undefined | null>,
): string {
  const { pathname: bare } = stripLocalePrefix(normalizePathname(pathname));
  const path =
    locale === URL_DEFAULT_LOCALE
      ? bare
      : bare === "/"
        ? `/${locale}`
        : `/${locale}${bare}`;

  const params = new URLSearchParams();

  if (searchParams) {
    const entries =
      searchParams instanceof URLSearchParams
        ? [...searchParams.entries()]
        : Object.entries(searchParams);
    for (const [key, value] of entries) {
      if (key === LANG_QUERY_PARAM) continue;
      if (value == null || value === "") continue;
      params.set(key, value);
    }
  }

  const qs = params.toString();
  if (!qs) return path;
  return `${path}?${qs}`;
}

export function absoluteLocalizedUrl(
  pathname: string,
  locale: Locale,
  searchParams?: URLSearchParams | Record<string, string | undefined | null>,
): string {
  return absoluteUrl(localizedHref(pathname, locale, searchParams));
}

/**
 * Reciprocal hreflang map. Only include locales that genuinely exist
 * (caller filters). `x-default` points at the English (unmarked) URL.
 */
export function hreflangLanguages(
  pathname: string,
  available: readonly Locale[],
  searchParams?: URLSearchParams | Record<string, string | undefined | null>,
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of available) {
    languages[locale] = absoluteLocalizedUrl(pathname, locale, searchParams);
  }
  if (available.includes(URL_DEFAULT_LOCALE)) {
    languages["x-default"] = absoluteLocalizedUrl(
      pathname,
      URL_DEFAULT_LOCALE,
      searchParams,
    );
  } else if (available.length > 0) {
    languages["x-default"] = absoluteLocalizedUrl(
      pathname,
      available[0]!,
      searchParams,
    );
  }
  return languages;
}

/**
 * Catalogue listing canonicals are language-path only (no filter params).
 * Kept for API compatibility; returns an empty bag because locale lives in the path.
 */
export function catalogueCanonicalParams(
  _locale: Locale,
): Record<string, string | undefined> {
  return {};
}
