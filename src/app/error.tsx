"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

function copyForLang(lang: string) {
  if (lang === "ar") {
    return {
      title: "حدث خطأ غير متوقع",
      body: "تعذّر تحميل هذه الصفحة. يُرجى المحاولة مرة أخرى.",
      retry: "إعادة المحاولة",
      home: "العودة إلى الرئيسية",
      homeHref: "/ar",
    };
  }
  return {
    title: "Something went wrong",
    body: "We couldn't load this page. Please try again.",
    retry: "Try again",
    home: "Back to Home",
    homeHref: "/",
  };
}

/**
 * Route error UI. Locale from `<html lang>` (set by root layout).
 * Never surfaces raw exception messages to visitors.
 */
export default function AppError({ error, reset }: Props) {
  const lang =
    typeof document !== "undefined"
      ? document.documentElement.lang || "en"
      : "en";
  const copy = useMemo(() => copyForLang(lang), [lang]);

  useEffect(() => {
    console.error("Route error:", error.digest ?? error.name);
  }, [error]);

  return (
    <main
      className="relative flex min-h-[70vh] flex-1 flex-col items-center justify-center overflow-hidden px-4 py-20"
      role="alert"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--brand-blue)_14%,transparent),transparent_55%),linear-gradient(180deg,#f7f9fc,white)]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto w-full max-w-lg text-center">
        <div
          className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand-blue)_12%,white)] text-[var(--brand-blue)]"
          aria-hidden
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="1.75"
            />
            <path
              d="M12 7.5v5.25"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            <circle cx="12" cy="16.25" r="1" fill="currentColor" />
          </svg>
        </div>
        <h1 className="font-editorial text-2xl font-semibold text-[var(--brand-blue)] sm:text-3xl">
          {copy.title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[var(--brand-gray)]">
          {copy.body}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[color-mix(in_srgb,var(--brand-blue)_88%,black)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]"
          >
            {copy.retry}
          </button>
          <Link
            href={copy.homeHref}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--brand-blue)] transition-colors hover:border-[var(--brand-blue)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]"
          >
            {copy.home}
          </Link>
        </div>
      </div>
    </main>
  );
}
