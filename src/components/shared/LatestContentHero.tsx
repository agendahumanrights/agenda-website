"use client";

import Link from "next/link";
import { useId, useState } from "react";

import { AuthorLink } from "@/components/publications/AuthorLink";
import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "@/components/shared/Breadcrumbs";
import { SoftImage } from "@/components/ui/SoftImage";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export type LatestContentHeroAuthor = {
  name: string;
  slug: string;
  byLabel: string;
};

export type LatestContentHeroProps = {
  locale: Locale;
  /** Page name for SEO H1 (sr-only when the item title is the visual headline). */
  pageTitle: string;
  breadcrumbs: BreadcrumbItem[];
  breadcrumbLabel: string;
  /** Category or “Event” label. */
  badge: string;
  title: string;
  subtitle?: string | null;
  href: string;
  imageUrl?: string | null;
  imageAlt?: string;
  dateTime?: string | null;
  dateLabel?: string | null;
  author?: LatestContentHeroAuthor | null;
  /** Optional CTA under meta (e.g. events). Omit for publications. */
  ctaLabel?: string | null;
  className?: string;
};

/**
 * Full-bleed single-item catalogue hero (newest publication / event).
 * Editorial bottom-start copy over cover media; branded gradient if image missing/fails.
 * Not a carousel — see homepage `FeaturedPublicationsSlider` for multi-item.
 */
export function LatestContentHero({
  locale,
  pageTitle,
  breadcrumbs,
  breadcrumbLabel,
  badge,
  title,
  subtitle,
  href,
  imageUrl = null,
  imageAlt = "",
  dateTime = null,
  dateLabel = null,
  author = null,
  ctaLabel = null,
  className,
}: LatestContentHeroProps) {
  const headingId = useId();
  const [imageFailed, setImageFailed] = useState(false);
  const trimmedSubtitle = subtitle?.trim() || null;
  const trimmedCta = ctaLabel?.trim() || null;
  const showImage = Boolean(imageUrl) && !imageFailed;
  const showMeta = Boolean((dateTime && dateLabel) || author);

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "relative flex w-full flex-col overflow-hidden bg-[var(--brand-blue)]",
        "min-h-[min(28rem,72svh)] sm:min-h-[min(34rem,78svh)] lg:min-h-[min(38rem,82svh)]",
        className,
      )}
    >
      <h1 id={headingId} className="sr-only">
        {pageTitle}
      </h1>

      <div className="absolute inset-0" aria-hidden={!showImage}>
        {showImage && imageUrl ? (
          <SoftImage
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="100vw"
            priority
            onError={() => setImageFailed(true)}
            className="object-cover object-center"
          />
        ) : (
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,color-mix(in_srgb,white_18%,transparent),transparent_55%),linear-gradient(135deg,var(--brand-blue),#032f5c)]"
            aria-hidden
          />
        )}
        <div className="hero-media-gradient absolute inset-0" />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.55)_0%,rgba(0,15,35,0.2)_38%,transparent_70%)]"
          aria-hidden
        />
      </div>

      <div className="relative z-10 flex min-h-[inherit] w-full flex-col pt-[var(--site-header-offset)]">
        <div className="px-4 pt-2 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={breadcrumbs}
            label={breadcrumbLabel}
            tone="onDark"
          />
        </div>

        <div
          className={cn(
            "mt-auto flex w-full flex-col justify-end",
            "px-4 pb-12 sm:px-6 sm:pb-14 lg:px-8 lg:pb-16",
          )}
        >
          <div className="w-full max-w-xl lg:max-w-[38rem]">
            <p
              className={cn(
                "text-[0.6875rem] font-semibold text-white/90 sm:text-xs",
                locale === "en" && "uppercase tracking-[0.16em]",
              )}
            >
              {badge}
            </p>

            <h2
              className={cn(
                "font-editorial mt-2 text-[clamp(1.5rem,3.2vw,2.75rem)] leading-[1.15] font-semibold text-balance text-white",
                "sm:mt-2.5",
                "card-overlay-text",
              )}
            >
              <Link
                href={href}
                className={cn(
                  "rounded-sm no-underline transition-colors hover:text-white/85",
                  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white",
                )}
              >
                {title}
              </Link>
            </h2>

            {trimmedSubtitle ? (
              <p className="mt-2 max-w-prose text-[clamp(0.9rem,1.4vw,1.125rem)] leading-relaxed text-white/90 text-pretty sm:mt-2.5">
                {trimmedSubtitle}
              </p>
            ) : null}

            {showMeta ? (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/85 sm:mt-3.5 sm:text-sm">
                {dateTime && dateLabel ? (
                  <time
                    dateTime={dateTime}
                    className={locale === "en" ? "uppercase tracking-wide" : undefined}
                  >
                    {dateLabel}
                  </time>
                ) : null}
                {author ? (
                  <>
                    {dateTime && dateLabel ? <span aria-hidden>·</span> : null}
                    <p className="text-white/90">
                      <span className="text-white/75">{author.byLabel} </span>
                      <AuthorLink
                        slug={author.slug}
                        name={author.name}
                        locale={locale}
                        className="font-medium text-white underline decoration-white/50 underline-offset-4 hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      />
                    </p>
                  </>
                ) : null}
              </div>
            ) : null}

            {trimmedCta ? (
              <Link
                href={href}
                className={cn(
                  "mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border border-white/75",
                  "bg-white/12 px-4 text-sm font-semibold text-white backdrop-blur-[2px]",
                  "transition-colors hover:bg-white/22",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                  "sm:mt-6",
                )}
              >
                {trimmedCta}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
