"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { setLocaleAction } from "@/i18n/actions";
import { LOCALES, type Locale } from "@/i18n/config";
import { LANG_QUERY_PARAM, URL_DEFAULT_LOCALE } from "@/lib/seo/locale-url";
import { cn } from "@/lib/utils";

type Props = {
  locale: Locale;
  label: string;
  /** `onGlass` for dark translucent chrome; default for light surfaces. */
  tone?: "default" | "onGlass";
};

/**
 * Switches language via crawlable `lang` query + cookie, then navigates.
 * English uses unmarked URLs; Arabic uses `?lang=ar`.
 */
export function LanguageSwitcher({
  locale,
  label,
  tone = "default",
}: Props) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const onGlass = tone === "onGlass";

  function switchTo(next: Locale) {
    if (next === locale || pending) return;
    startTransition(async () => {
      await setLocaleAction(next);
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (next === URL_DEFAULT_LOCALE) {
        params.delete(LANG_QUERY_PARAM);
      } else {
        params.set(LANG_QUERY_PARAM, next);
      }
      const qs = params.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      router.replace(href);
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-sm uppercase tracking-wide",
        onGlass &&
          "rounded-full border border-white/20 bg-white/10 px-2.5 py-1",
      )}
      aria-label={label}
      role="group"
    >
      {LOCALES.map((next, index) => (
        <span key={next} className="flex items-center gap-1.5">
          {index > 0 ? (
            <span
              aria-hidden
              className={onGlass ? "text-white/45" : "text-[var(--brand-gray)]"}
            >
              |
            </span>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={() => switchTo(next)}
            className={cn(
              "rounded-sm px-0.5 py-0.5 disabled:opacity-60",
              onGlass
                ? "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                : "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]",
              next === locale
                ? onGlass
                  ? "font-semibold text-white"
                  : "font-semibold text-[var(--brand-blue)]"
                : onGlass
                  ? "text-white/70 hover:text-white"
                  : "text-[var(--brand-gray)] hover:text-[var(--brand-blue)]",
            )}
            aria-current={next === locale ? "true" : undefined}
            aria-pressed={next === locale}
            lang={next}
          >
            {next}
          </button>
        </span>
      ))}
    </div>
  );
}
