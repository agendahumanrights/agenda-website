import type { Locale } from "@/i18n/config";
import { absoluteUrl } from "@/lib/seo/site-url";

/** Crawlable language query param (English = unmarked URL). */
export const LANG_QUERY_PARAM = "lang";

/**
 * Locale for unmarked public URLs (no `lang` query).
 * Arabic uses `?lang=ar`. Matches Search Console / hreflang URL strategy.
 */
export const URL_DEFAULT_LOCALE: Locale = "en";

export function isLocaleQueryValue(value: string | null | undefined): value is Locale {
  return value === "ar" || value === "en";
}

/**
 * Build a site-relative href for a locale.
 * English omits `lang`; Arabic sets `lang=ar`. Other query params are preserved.
 */
export function localizedHref(
  pathname: string,
  locale: Locale,
  searchParams?: URLSearchParams | Record<string, string | undefined | null>,
): string {
  const path = !pathname || pathname === "" ? "/" : pathname.startsWith("/") ? pathname : `/${pathname}`;
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

  if (locale !== URL_DEFAULT_LOCALE) {
    params.set(LANG_QUERY_PARAM, locale);
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

/** Strip filter/sort/search params for catalogue canonicals. */
export function catalogueCanonicalParams(
  locale: Locale,
): Record<string, string | undefined> {
  return locale === URL_DEFAULT_LOCALE ? {} : { [LANG_QUERY_PARAM]: locale };
}
