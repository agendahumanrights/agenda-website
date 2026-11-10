import "server-only";

import { UI_FALLBACK_LOCALE, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  ar: () => import("@/messages/ar.json").then((m) => m.default),
  en: () => import("@/messages/en.json").then((m) => m.default),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  try {
    return await dictionaries[locale]();
  } catch {
    if (locale !== UI_FALLBACK_LOCALE) {
      return dictionaries[UI_FALLBACK_LOCALE]();
    }
    throw new Error(`Missing UI dictionary for locale: ${locale}`);
  }
}
