import type { Locale } from "@/i18n/config";

/**
 * Public pages show only the PDF that matches the active locale.
 * Never cross-fall back to the other language.
 */
export function resolveLocalePdfUrl(input: {
  locale: Locale;
  pdfEnUrl?: string | null;
  pdfArUrl?: string | null;
}): string | null {
  const url = input.locale === "ar" ? input.pdfArUrl : input.pdfEnUrl;
  const trimmed = url?.trim();
  return trimmed ? trimmed : null;
}
