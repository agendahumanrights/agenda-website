import Link from "next/link";

import { cn } from "@/lib/utils";

type Action = {
  href: string;
  label: string;
  primary?: boolean;
};

type Props = {
  code?: string;
  title: string;
  body: string;
  actions: Action[];
  dir?: "ltr" | "rtl";
  lang?: string;
};

/**
 * Shared branded shell for 404 / unexpected errors (public + global).
 */
export function BrandedStatusPage({
  code,
  title,
  body,
  actions,
  dir,
  lang,
}: Props) {
  return (
    <main
      className="relative flex min-h-[70vh] flex-1 flex-col items-center justify-center overflow-hidden px-4 py-20"
      dir={dir}
      lang={lang}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--brand-blue)_14%,transparent),transparent_55%),linear-gradient(180deg,#f7f9fc,white)]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto w-full max-w-lg text-center">
        {code ? (
          <p
            className="font-editorial text-6xl font-semibold tracking-tight text-[color-mix(in_srgb,var(--brand-blue)_35%,white)] sm:text-7xl"
            aria-hidden
          >
            {code}
          </p>
        ) : (
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
        )}
        <h1 className="font-editorial mt-2 text-2xl font-semibold text-[var(--brand-blue)] sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[var(--brand-gray)]">
          {body}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {actions.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className={cn(
                "inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]",
                action.primary
                  ? "bg-[var(--brand-blue)] text-white hover:bg-[color-mix(in_srgb,var(--brand-blue)_88%,black)]"
                  : "border border-[var(--border)] bg-white text-[var(--brand-blue)] hover:border-[var(--brand-blue)]",
              )}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
