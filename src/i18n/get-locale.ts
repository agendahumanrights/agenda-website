import "server-only";

import { cookies, headers } from "next/headers";

import type { Locale } from "@/i18n/config";
import { isLocale } from "@/i18n/config";
import {
  LOCALE_COOKIE_NAME,
  LOCALE_HEADER_NAME,
  parseLocaleCookie,
} from "@/i18n/locale-cookie";
import { URL_DEFAULT_LOCALE } from "@/lib/seo/locale-url";

export { LOCALE_HEADER_NAME };

/**
 * Resolves the active locale for the request:
 * 1. Proxy `x-agenda-lang` header — from `/ar` prefix (or forced English on unmarked public URLs)
 * 2. `agenda_locale` cookie — admin UI / switcher when header absent
 * 3. English (unmarked URL default) when neither is present
 *
 * Calling cookies()/headers() keeps responses request-specific.
 */
export async function getRequestLocale(): Promise<Locale> {
  const headerStore = await headers();
  const fromUrl = headerStore.get(LOCALE_HEADER_NAME);
  if (fromUrl && isLocale(fromUrl)) {
    return fromUrl;
  }

  const jar = await cookies();
  const raw = jar.get(LOCALE_COOKIE_NAME)?.value;
  if (raw && isLocale(raw)) {
    return raw;
  }

  return URL_DEFAULT_LOCALE;
}

/** Cookie parse helper retained for tests and non-request contexts. */
export function localeFromCookieValue(
  value: string | undefined | null,
): Locale {
  return parseLocaleCookie(value);
}
