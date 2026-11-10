"use client";

import Link from "next/link";
import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";

import { AuthorLink } from "@/components/publications/AuthorLink";
import { SoftImage } from "@/components/ui/SoftImage";
import { sitePath } from "@/i18n/pathnames";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";
import type { PublicationListItem } from "@/types/publication";

type Props = {
  locale: Locale;
  items: PublicationListItem[];
  labels: Dictionary["home"];
  categoryLabels: Dictionary["publications"];
};

/**
 * Manual prev/next only — no automatic rotation (requirements §1.1).
 */
export function FeaturedPublicationsSlider({
  locale,
  items,
  labels,
  categoryLabels,
}: Props) {
  const [index, setIndex] = useState(0);
  const [failedImageIds, setFailedImageIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [loadedImages, setLoadedImages] = useState<Record<number, true>>({
    0: true,
  });
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const headingId = useId();
  const isRtl = locale === "ar";
  const multi = items.length > 1;

  const safeIndex = items.length === 0 ? 0 : Math.min(index, items.length - 1);
  const current = items[safeIndex];

  const goTo = useCallback(
    (next: number) => {
      if (items.length === 0) return;
      const wrapped = ((next % items.length) + items.length) % items.length;
      setIndex(wrapped);
      setLoadedImages((prev) => ({ ...prev, [wrapped]: true }));
    },
    [items.length],
  );

  const goPrev = useCallback(() => {
    goTo(safeIndex - 1);
  }, [goTo, safeIndex]);

  const goNext = useCallback(() => {
    goTo(safeIndex + 1);
  }, [goTo, safeIndex]);

  function onKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (!multi) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (isRtl) goNext();
      else goPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      if (isRtl) goPrev();
      else goNext();
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(items.length - 1);
    }
  }

  function onTouchStart(event: ReactTouchEvent) {
    const touch = event.touches[0];
    if (!touch) return;
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchEnd(event: ReactTouchEvent) {
    if (!multi || !touchStart.current) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    touchStart.current = null;

    // Prefer vertical page scroll when the gesture is mostly vertical.
    if (Math.abs(dx) < 48 || Math.abs(dy) > Math.abs(dx) * 0.75) return;

    if (dx > 0) {
      if (isRtl) goNext();
      else goPrev();
    } else if (isRtl) goPrev();
    else goNext();
  }

  if (items.length === 0 || !current) {
    return (
      <section
        aria-labelledby={headingId}
        className="hero-viewport flex w-full items-center bg-[color-mix(in_srgb,var(--brand-blue)_8%,white)]"
      >
        <div className="mx-auto w-full max-w-3xl px-6 pt-[calc(var(--site-header-offset)+0.5rem)] pb-16 text-center sm:px-8">
          <h2
            id={headingId}
            className="font-editorial text-2xl font-semibold text-[var(--brand-blue)] sm:text-3xl"
          >
            {labels.featuredPublications}
          </h2>
          <p className="mt-3 text-base text-[var(--brand-gray)]">
            {labels.sliderEmpty}
          </p>
        </div>
      </section>
    );
  }

  const href = sitePath(`/publications/${current.slug}`, locale);
  const categoryLabel = current.category.name;
  const showImage =
    Boolean(current.mainImageUrl) && !failedImageIds.has(current.id);
  const dateLabel = current.publishedAt
    ? new Date(current.publishedAt).toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <section
      aria-roledescription="carousel"
      aria-labelledby={headingId}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={cn(
        "hero-viewport relative flex w-full flex-col overflow-hidden bg-[var(--brand-blue)] outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2",
      )}
    >
      <h2 id={headingId} className="sr-only">
        {labels.featuredPublications}
      </h2>

      <div className="absolute inset-0" aria-hidden={!showImage}>
        {items.map((item, i) => {
          const active = i === safeIndex;
          const shouldLoad = loadedImages[i] || active;
          if (!shouldLoad || !item.mainImageUrl) return null;
          return (
            <SoftImage
              key={item.id}
              src={item.mainImageUrl}
              alt=""
              fill
              sizes="100vw"
              priority={i === 0}
              onError={() => {
                setFailedImageIds((prev) => {
                  if (prev.has(item.id)) return prev;
                  const next = new Set(prev);
                  next.add(item.id);
                  return next;
                });
              }}
              className={cn(
                "hero-slide-transition object-cover transition-opacity duration-500",
                active && !failedImageIds.has(item.id)
                  ? "opacity-100"
                  : "opacity-0",
              )}
            />
          );
        })}
        {!showImage ? (
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,color-mix(in_srgb,white_18%,transparent),transparent_55%),linear-gradient(135deg,var(--brand-blue),#032f5c)]"
            aria-hidden
          />
        ) : null}
        <div className="hero-media-gradient absolute inset-0" />
      </div>

      <div
        className={cn(
          "relative z-10 flex flex-1 flex-col justify-end pt-[var(--site-header-offset)]",
          multi
            ? "px-14 pb-20 sm:px-16 sm:pb-24 lg:px-6"
            : "px-4 pb-14 sm:px-6 sm:pb-20",
        )}
      >
        <div className="mx-auto w-full">
        <div className="max-w-xl lg:max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/90 sm:text-sm">
            {categoryLabel}
          </p>
          <h3 className="font-editorial mt-3 text-[clamp(1.75rem,4.2vw,3.25rem)] leading-[1.15] font-semibold text-balance text-white">
            <Link
              href={href}
              className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              {current.title}
            </Link>
          </h3>
          {current.subtitle ? (
            <p className="mt-3 max-w-prose text-[clamp(0.95rem,1.6vw,1.125rem)] leading-relaxed text-white/90 text-pretty">
              {current.subtitle}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm uppercase tracking-wide text-white/85">
            {dateLabel && current.publishedAt ? (
              <time dateTime={current.publishedAt}>{dateLabel}</time>
            ) : null}
            {current.category.requiresAuthor &&
            current.authorName &&
            current.authorBioKey ? (
              <>
                {dateLabel ? <span aria-hidden>·</span> : null}
                <AuthorLink
                  bioKey={current.authorBioKey}
                  name={current.authorName}
                  locale={locale}
                  className="normal-case tracking-normal text-white underline decoration-white/50 underline-offset-4 hover:decoration-white"
                />
              </>
            ) : null}
          </div>

          <Link
            href={href}
            className={cn(
              "mt-7 inline-flex items-center gap-2 border border-white/85 px-5 py-2.5 text-sm font-medium text-white",
              "transition-colors hover:border-white hover:bg-white hover:text-[var(--brand-blue)]",
              "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white",
            )}
          >
            <span>{labels.readMore}</span>
            <span aria-hidden className="rtl:rotate-180">
              →
            </span>
          </Link>
        </div>
        </div>
      </div>

      {multi ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label={labels.sliderPrev}
            className={cn(
              "absolute start-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full",
              "border border-white/50 bg-black/35 text-white backdrop-blur-[2px]",
              "transition-colors hover:bg-black/55",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
              "sm:start-5",
            )}
          >
            <Chevron direction={isRtl ? "right" : "left"} />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label={labels.sliderNext}
            className={cn(
              "absolute end-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full",
              "border border-white/50 bg-black/35 text-white backdrop-blur-[2px]",
              "transition-colors hover:bg-black/55",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
              "sm:end-5",
            )}
          >
            <Chevron direction={isRtl ? "left" : "right"} />
          </button>

          <div
            className="absolute inset-x-0 bottom-5 z-20 flex justify-center gap-2.5"
            role="tablist"
            aria-label={labels.featuredPublications}
          >
            {items.map((item, i) => {
              const selected = i === safeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-label={labels.goToSlide.replace("{n}", String(i + 1))}
                  onClick={() => goTo(i)}
                  className={cn(
                    "h-2.5 w-2.5 rounded-full border border-white transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                    selected ? "bg-white" : "bg-transparent hover:bg-white/40",
                  )}
                />
              );
            })}
          </div>
        </>
      ) : null}
    </section>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden
      className="stroke-current"
    >
      {direction === "left" ? (
        <path
          d="M11 4.5L6.5 9l4.5 4.5"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M7 4.5L11.5 9 7 13.5"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
