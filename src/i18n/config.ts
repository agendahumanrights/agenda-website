import {
  DEFAULT_LOCALE,
  LOCALES,
  type Locale,
  isLocale,
  localeDirection,
} from "@/types/locale";

export { DEFAULT_LOCALE, LOCALES, isLocale, localeDirection };
export type { Locale };

/**
 * Fallback policy for UI dictionaries (messages/*.json):
 * - Missing keys fall back to the English string when available, then to the key itself.
 * - Database content translations do NOT use this policy: public pages require a
 *   translation for the active locale (or show not-found / empty state).
 *
 * Public language selection:
 * - Crawlable `?lang=ar` (English URLs are unmarked) via proxy header
 * - `agenda_locale` cookie for returning visitors / switcher
 * - Unmarked URL fallback is English (`URL_DEFAULT_LOCALE`) when neither is set
 * Legacy `/ar` and `/en` prefixes redirect to unprefixed paths (+ `lang` for Arabic).
 */
export const UI_FALLBACK_LOCALE: Locale = "en";
