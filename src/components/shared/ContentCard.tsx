import Link from "next/link";

import { AuthorLink } from "@/components/publications/AuthorLink";
import { CardMedia } from "@/components/shared/CardMedia";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type AuthorInfo = {
  name: string;
  slug: string;
};

type Props = {
  href: string;
  imageUrl: string | null;
  imageAlt: string;
  badge: string;
  title: string;
  excerpt?: string | null;
  dateTime?: string | null;
  dateLabel?: string | null;
  authors?: AuthorInfo[];
  byLabel?: string;
  locale?: Locale;
  className?: string;
};

/**
 * Shared publication/event card: compact full-bleed cover with bottom text overlay.
 * Title uses a stretched link for card navigation; author links sit above it (z-index)
 * so writer profiles remain reachable without nested anchors.
 */
export function ContentCard({
  href,
  imageUrl,
  imageAlt,
  badge,
  title,
  excerpt,
  dateTime,
  dateLabel,
  authors = [],
  byLabel,
  locale,
  className,
}: Props) {
  const trimmedExcerpt = excerpt?.trim() || null;
  const showDate = Boolean(dateTime && dateLabel);
  const showAuthors = authors.length > 0;
  const showMeta = Boolean(showAuthors || showDate);

  return (
    <article
      className={cn(
        /* Landscape editorial proportions — taller on small screens for copy room */
        "group relative aspect-[5/4] overflow-hidden rounded-xl sm:aspect-[4/3]",
        "bg-[color-mix(in_srgb,var(--brand-blue)_88%,#021a33)]",
        "shadow-[0_6px_18px_rgba(5,73,140,0.1)] ring-1 ring-[color-mix(in_srgb,var(--brand-blue)_10%,transparent)]",
        "motion-safe:transition-[transform,box-shadow] motion-safe:duration-200",
        "motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_12px_28px_rgba(5,73,140,0.18)]",
        "motion-reduce:transition-none",
        className,
      )}
    >
      <CardMedia
        src={imageUrl}
        alt={imageAlt}
        className="absolute inset-0 h-full w-full"
      />

      {/* Readability wash — pointer-events none so clicks pass to the title link */}
      <div
        className={cn(
          "content-card-gradient pointer-events-none absolute inset-0 z-[1]",
          /* Explicit wash so readability does not depend on globals.css HMR */
          "bg-[linear-gradient(to_top,rgba(0,0,0,0.78)_0%,rgba(0,16,38,0.45)_28%,rgba(0,16,38,0.14)_48%,transparent_65%)]",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-[1] bg-black/0",
          "motion-safe:transition-colors motion-safe:duration-300",
          "motion-safe:group-hover:bg-black/10 motion-safe:group-focus-within:bg-black/10",
        )}
        aria-hidden
      />

      <span
        className={cn(
          "pointer-events-none absolute top-3 end-3 z-[3] rounded bg-white/95 px-2 py-0.5",
          "text-[12px] font-semibold leading-none text-[var(--brand-blue)] shadow-sm",
          "sm:top-3.5 sm:end-3.5",
        )}
      >
        {badge}
      </span>

      <div
        className={cn(
          "card-overlay-text absolute inset-x-0 bottom-0 z-[2] flex flex-col",
          "px-3.5 pb-3.5 pt-10 text-white sm:px-4 sm:pb-4 sm:pt-12",
          /* Tailwind arbitrary fallback if globals.css HMR lags */
          "[text-shadow:0_1px_3px_rgba(0,0,0,0.75),0_2px_8px_rgba(0,20,45,0.35)]",
        )}
      >
        <h3
          data-typography="compact"
          className={cn(
            "font-editorial text-[1.05rem] leading-[1.28] font-semibold text-balance",
            "sm:text-[1.125rem] sm:leading-[1.26]",
          )}
        >
          <Link
            href={href}
            className={cn(
              "line-clamp-2 rounded-sm no-underline [overflow-wrap:anywhere] sm:line-clamp-3",
              "transition-colors hover:text-white/90",
              /* Stretched hit target for the whole card */
              "after:absolute after:inset-0 after:z-[1]",
              "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white",
            )}
          >
            {title}
          </Link>
        </h3>

        {trimmedExcerpt ? (
          <p className="mt-1.5 line-clamp-2 text-[0.8125rem] leading-[1.4] text-white/95 text-pretty sm:text-[0.875rem] sm:leading-[1.42]">
            {trimmedExcerpt}
          </p>
        ) : null}

        {showMeta ? (
          <div className="mt-2 flex flex-col gap-1">
            {showAuthors ? (
              <p className="relative z-[3] line-clamp-2 text-[0.75rem] leading-snug text-white/95 sm:text-[0.8125rem]">
                {byLabel ? (
                  <span className="text-white/80">{byLabel} </span>
                ) : null}
                {authors.map((author, index) => (
                  <span key={`${author.slug}-${index}`}>
                    {index > 0 ? (
                      <span className="text-white/70" aria-hidden>
                        {" · "}
                      </span>
                    ) : null}
                    <AuthorLink
                      slug={author.slug}
                      name={author.name}
                      locale={locale}
                      className="font-medium text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    />
                  </span>
                ))}
              </p>
            ) : null}

            {showDate ? (
              <time
                dateTime={dateTime!}
                className="text-[0.75rem] leading-snug text-white/90 sm:text-[0.8125rem]"
              >
                {dateLabel}
              </time>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
