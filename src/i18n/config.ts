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
 * - Crawlable `/ar/...` prefix (English URLs are unmarked) via proxy rewrite + header
 * - `agenda_locale` cookie for admin UI / switcher
 * - Unmarked public URLs resolve as English (`URL_DEFAULT_LOCALE`)
 * Legacy `?lang=ar` redirects to `/ar/...`; `/en/...` redirects to unmarked.
 */
export const UI_FALLBACK_LOCALE: Locale = "en";
