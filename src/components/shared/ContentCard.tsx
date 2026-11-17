import Link from "next/link";

import { AuthorLink } from "@/components/publications/AuthorLink";
import { CardMedia } from "@/components/shared/CardMedia";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type AuthorInfo = {
  name: string;
  bioKey: string;
  byLabel: string;
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
  author?: AuthorInfo | null;
  locale?: Locale;
  className?: string;
};

/**
 * Shared publication/event card: 4:3 media, compact blue panel,
 * aligned title/excerpt/footer row across grid cells.
 * Title (and image) link to the detail page — no separate Read more CTA.
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
  author,
  locale,
  className,
}: Props) {
  const trimmedExcerpt = excerpt?.trim() || null;

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl bg-white",
        "shadow-[0_6px_18px_rgba(5,73,140,0.1)] ring-1 ring-[color-mix(in_srgb,var(--brand-blue)_10%,transparent)]",
        "motion-safe:transition-[transform,box-shadow] motion-safe:duration-200",
        "motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_10px_24px_rgba(5,73,140,0.16)]",
        "motion-reduce:transition-none",
        className,
      )}
    >
      <div className="relative shrink-0">
        <Link
          href={href}
          className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]"
        >
          <CardMedia src={imageUrl} alt={imageAlt} />
        </Link>
        <span
          className={cn(
            "pointer-events-none absolute top-3 end-3 z-10 rounded bg-white px-2 py-0.5",
            "text-[12px] font-semibold leading-none text-[var(--brand-blue)] shadow-sm",
            "sm:top-4 sm:end-4",
          )}
        >
          {badge}
        </span>
      </div>

      <div className="flex flex-1 flex-col bg-[var(--brand-blue)] px-4 py-4 text-white sm:px-5 sm:py-5">
        <h3
          className={cn(
            "font-editorial text-[1.2rem] leading-[1.4] font-semibold text-balance sm:text-[1.3rem]",
            // Reserve two lines on desktop for equal row heights
            "lg:min-h-[calc(1.4em*2)]",
          )}
        >
          <Link
            href={href}
            className={cn(
              "line-clamp-2 rounded-sm no-underline [overflow-wrap:anywhere]",
              "transition-colors hover:text-white/85",
              "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white",
            )}
          >
            {title}
          </Link>
        </h3>

        <div
          className={cn(
            "mt-2.5",
            // Reserve two excerpt lines on desktop (was three — reduced empty blue)
            "lg:min-h-[calc(1.55em*2)]",
          )}
        >
          {trimmedExcerpt ? (
            <p className="line-clamp-2 text-[0.9375rem] leading-[1.55] text-white/92 text-pretty sm:text-[0.975rem]">
              {trimmedExcerpt}
            </p>
          ) : null}
        </div>

        {author ? (
          <p className="mt-3 text-[0.8125rem] leading-snug text-white/90 sm:text-sm">
            <span className="text-white/75">{author.byLabel} </span>
            <AuthorLink
              bioKey={author.bioKey}
              name={author.name}
              locale={locale}
              className="font-medium text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            />
          </p>
        ) : null}

        {dateTime && dateLabel ? (
          <time
            dateTime={dateTime}
            className="mt-auto pt-4 text-[0.8125rem] leading-snug text-white/85 sm:text-sm"
          >
            {dateLabel}
          </time>
        ) : null}
      </div>
    </article>
  );
}
