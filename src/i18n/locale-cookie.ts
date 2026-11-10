import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";

/** Cookie used for UI + content language preference. */
export const LOCALE_COOKIE_NAME = "agenda_locale";

/** Request header set by `proxy.ts` from the `/ar` prefix (or unmarked English). */
export const LOCALE_HEADER_NAME = "x-agenda-lang";

export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function parseLocaleCookie(value: string | undefined | null): Locale {
  if (value && isLocale(value)) {
    return value;
  }
  return DEFAULT_LOCALE;
}

export function localeCookieOptions(locale: Locale) {
  return {
    name: LOCALE_COOKIE_NAME,
    value: locale,
    httpOnly: false,
    sameSite: "lax" as const,
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
  };
}
