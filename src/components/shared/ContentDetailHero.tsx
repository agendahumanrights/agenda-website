"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";

import { AuthorLink } from "@/components/publications/AuthorLink";
import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "@/components/shared/Breadcrumbs";
import { SoftImage } from "@/components/ui/SoftImage";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import type { DetailMediaImage } from "@/types/media";

export type ContentDetailHeroAuthor = {
  name: string;
  slug: string;
};

export type ContentDetailHeroLabels = {
  previous: string;
  next: string;
  imageOf: string;
  goToImage: string;
  gallery: string;
  imageFailed: string;
};

export type ContentDetailHeroProps = {
  locale: Locale;
  breadcrumbs: BreadcrumbItem[];
  breadcrumbLabel: string;
  /** Category or “Event” label. */
  badge: string;
  title: string;
  subtitle?: string | null;
  /** Main + gallery images; hero slides through all manually. */
  images?: DetailMediaImage[];
  /** Used when `images` is empty. */
  fallbackImageUrl?: string | null;
  fallbackImageAlt?: string;
  dateTime?: string | null;
  dateLabel?: string | null;
  authors?: ContentDetailHeroAuthor[];
  byLabel?: string;
  galleryLabels: ContentDetailHeroLabels;
  className?: string;
};

/**
 * Full-bleed detail hero: cover slider (main + gallery) with overlaid title /
 * subtitle / meta. Manual prev/next, counter, thumbs, keyboard, and swipe.
 */
export function ContentDetailHero({
  locale,
  breadcrumbs,
  breadcrumbLabel,
  badge,
  title,
  subtitle,
  images = [],
  fallbackImageUrl = null,
  fallbackImageAlt = "",
  dateTime = null,
  dateLabel = null,
  authors = [],
  byLabel,
  galleryLabels,
  className,
}: ContentDetailHeroProps) {
  const slides: DetailMediaImage[] =
    images.length > 0
      ? images
      : fallbackImageUrl
        ? [{ id: "fallback", url: fallbackImageUrl, alt: fallbackImageAlt || title }]
        : [];

  const [index, setIndex] = useState(0);
  const [failedIds, setFailedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [loaded, setLoaded] = useState<Record<number, true>>({ 0: true });
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLElement>(null);
  const labelId = useId();

  const isRtl = locale === "ar";
  const multi = slides.length > 1;
  const safeIndex =
    slides.length === 0 ? 0 : Math.min(index, slides.length - 1);
  const trimmedSubtitle = subtitle?.trim() || null;
  const showAuthors = authors.length > 0;
  const showMeta = Boolean((dateTime && dateLabel) || showAuthors);

  const goTo = useCallback(
    (next: number) => {
      if (slides.length === 0) return;
      const wrapped = ((next % slides.length) + slides.length) % slides.length;
      setIndex(wrapped);
      setLoaded((prev) => ({ ...prev, [wrapped]: true }));
    },
    [slides.length],
  );

  const goPrev = useCallback(() => goTo(safeIndex - 1), [goTo, safeIndex]);
  const goNext = useCallback(() => goTo(safeIndex + 1), [goTo, safeIndex]);

  // Keep the active thumb visible in the strip without scrolling the page down.
  useEffect(() => {
    const container = thumbsRef.current;
    const thumb = container?.querySelector<HTMLElement>(
      `[data-thumb-index="${safeIndex}"]`,
    );
    if (!container || !thumb) return;

    const containerRect = container.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const overflowStart = thumbRect.left - containerRect.left;
    const overflowEnd = thumbRect.right - containerRect.right;

    if (overflowStart < 0) {
      container.scrollBy({ left: overflowStart - 8, behavior: "smooth" });
    } else if (overflowEnd > 0) {
      container.scrollBy({ left: overflowEnd + 8, behavior: "smooth" });
    }
  }, [safeIndex]);

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
      goTo(slides.length - 1);
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
    if (Math.abs(dx) < 48 || Math.abs(dy) > Math.abs(dx) * 0.75) return;
    if (dx > 0) {
      if (isRtl) goNext();
      else goPrev();
    } else if (isRtl) goPrev();
    else goNext();
  }

  function markFailed(id: string) {
    setFailedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  return (
    <header
      ref={regionRef}
      role="region"
      aria-roledescription={multi ? "carousel" : undefined}
      aria-labelledby={labelId}
      tabIndex={multi ? 0 : undefined}
      onKeyDown={onKeyDown}
      className={cn(
        "flex w-full flex-col bg-white outline-none",
        multi &&
          "focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2",
        className,
      )}
    >
      <h2 id={labelId} className="sr-only">
        {galleryLabels.gallery}
      </h2>

      {/* Full-bleed stage — full viewport width/height; title overlay on the image */}
      <div
        className="hero-viewport relative flex w-full flex-col overflow-hidden bg-[var(--brand-blue)]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="absolute inset-0">
          {slides.length > 0 ? (
            slides.map((image, i) => {
              if (!loaded[i] && i !== safeIndex) return null;
              const active = i === safeIndex;
              const isFailed = failedIds.has(image.id);
              return (
                <div
                  key={image.id}
                  className={cn(
                    "absolute inset-0 transition-opacity duration-300",
                    active ? "opacity-100" : "pointer-events-none opacity-0",
                  )}
                  aria-hidden={!active}
                >
                  {isFailed ? (
                    <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,var(--brand-blue),#032f5c)] px-6 text-center text-sm text-white/80">
                      {galleryLabels.imageFailed}
                    </div>
                  ) : (
                    <SoftImage
                      src={image.url}
                      alt={active ? image.alt : ""}
                      fill
                      sizes="100vw"
                      priority={i === 0}
                      onError={() => markFailed(image.id)}
                      className="object-cover object-center"
                    />
                  )}
                </div>
              );
            })
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

        {multi ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              onMouseDown={(event) => event.preventDefault()}
              aria-label={galleryLabels.previous}
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
              onMouseDown={(event) => event.preventDefault()}
              aria-label={galleryLabels.next}
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
              aria-label={galleryLabels.gallery}
            >
              {slides.map((image, i) => {
                const selected = i === safeIndex;
                return (
                  <button
                    key={image.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-label={galleryLabels.goToImage.replace(
                      "{n}",
                      String(i + 1),
                    )}
                    onClick={() => goTo(i)}
                    onMouseDown={(event) => event.preventDefault()}
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

        <div className="relative z-10 flex min-h-[inherit] w-full flex-col pt-[var(--site-header-offset)]">
          <div className="px-4 pt-2 sm:px-6 lg:px-8">
            <Breadcrumbs
              items={breadcrumbs}
              label={breadcrumbLabel}
              tone="onDark"
            />
          </div>

          <div className="mt-auto flex w-full flex-col justify-end px-4 pb-12 sm:px-6 sm:pb-14 lg:px-8 lg:pb-16">
            <div className="w-full max-w-xl lg:max-w-[38rem]">
              <p
                className={cn(
                  "text-[0.6875rem] font-semibold text-white/90 sm:text-xs",
                  locale === "en" && "uppercase tracking-[0.16em]",
                )}
              >
                {badge}
              </p>

              <h1
                data-typography="compact"
                className={cn(
                  "font-editorial mt-2 text-[clamp(1.5rem,3.2vw,2.75rem)] leading-[1.15] font-semibold text-balance text-white",
                  "sm:mt-2.5",
                  "card-overlay-text",
                )}
              >
                {title}
              </h1>

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
                      className={
                        locale === "en" ? "uppercase tracking-wide" : undefined
                      }
                    >
                      {dateLabel}
                    </time>
                  ) : null}
                  {showAuthors ? (
                    <>
                      {dateTime && dateLabel ? (
                        <span aria-hidden>·</span>
                      ) : null}
                      <p className="max-w-full text-white/90">
                        {byLabel ? (
                          <span className="text-white/75">{byLabel} </span>
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
                              className="font-medium text-white underline decoration-white/50 underline-offset-4 hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                            />
                          </span>
                        ))}
                      </p>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnails sit under the big image (same pattern as the former MediaGallery). */}
      {multi ? (
        <div className="w-full bg-white px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div
            ref={thumbsRef}
            className="mx-auto max-w-6xl overflow-x-auto pb-1 xl:max-w-7xl"
            role="tablist"
            aria-label={galleryLabels.gallery}
          >
            <div className="flex w-max min-w-full justify-center gap-2">
              {slides.map((image, i) => {
                const selected = i === safeIndex;
                return (
                  <button
                    key={image.id}
                    type="button"
                    role="tab"
                    data-thumb-index={i}
                    aria-selected={selected}
                    aria-label={galleryLabels.goToImage.replace(
                      "{n}",
                      String(i + 1),
                    )}
                    onClick={() => goTo(i)}
                    className={cn(
                      "relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)] sm:h-20 sm:w-20",
                      selected
                        ? "ring-2 ring-[var(--brand-blue)] ring-offset-2"
                        : "ring-1 ring-zinc-200",
                    )}
                  >
                    {failedIds.has(image.id) ? (
                      <span className="flex h-full items-center justify-center text-[0.65rem] text-[var(--brand-gray)]">
                        —
                      </span>
                    ) : (
                      <SoftImage
                        src={image.url}
                        alt=""
                        fill
                        sizes="80px"
                        onError={() => markFailed(image.id)}
                        className="object-cover object-center"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </header>
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
