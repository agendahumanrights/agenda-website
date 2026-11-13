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

import { SoftImage } from "@/components/ui/SoftImage";
import { cn } from "@/lib/utils";
import type { DetailMediaImage } from "@/types/media";

export type GalleryLabels = {
  gallery: string;
  previous: string;
  next: string;
  enlarge: string;
  close: string;
  imageOf: string;
  imageFailed: string;
  goToImage: string;
};

type Props = {
  images: DetailMediaImage[];
  labels: GalleryLabels;
  className?: string;
};

export function MediaGallery({ images, labels, className }: Props) {
  const [index, setIndex] = useState(0);
  const [failedIds, setFailedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [loaded, setLoaded] = useState<Record<number, true>>({ 0: true });
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const labelId = useId();

  const multi = images.length > 1;
  const safeIndex = images.length === 0 ? 0 : Math.min(index, images.length - 1);
  const current = images[safeIndex];

  const goTo = useCallback(
    (next: number) => {
      if (images.length === 0) return;
      const wrapped = ((next % images.length) + images.length) % images.length;
      setIndex(wrapped);
      setLoaded((prev) => ({ ...prev, [wrapped]: true }));
    },
    [images.length],
  );

  const goPrev = useCallback(() => goTo(safeIndex - 1), [goTo, safeIndex]);
  const goNext = useCallback(() => goTo(safeIndex + 1), [goTo, safeIndex]);

  useEffect(() => {
    const thumb = thumbsRef.current?.querySelector<HTMLElement>(
      `[data-thumb-index="${safeIndex}"]`,
    );
    thumb?.scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  }, [safeIndex]);

  useEffect(() => {
    if (!lightboxOpen) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    queueMicrotask(() => closeButtonRef.current?.focus());

    const onKey = (event: KeyboardEvent) => {
      const rtl =
        document.documentElement.getAttribute("dir") === "rtl";
      if (event.key === "Escape") {
        event.preventDefault();
        setLightboxOpen(false);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (rtl) goNext();
        else goPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (rtl) goPrev();
        else goNext();
      } else if (event.key === "Tab") {
        const root = document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]');
        if (!root) return;
        const focusable = root.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus();
    };
  }, [lightboxOpen, goPrev, goNext]);

  if (images.length === 0 || !current) return null;

  const failed = failedIds.has(current.id);
  const counter = labels.imageOf
    .replace("{current}", String(safeIndex + 1).padStart(2, "0"))
    .replace("{total}", String(images.length).padStart(2, "0"));

  function isRtlDoc() {
    return (
      typeof document !== "undefined" &&
      document.documentElement.getAttribute("dir") === "rtl"
    );
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const rtl = isRtlDoc();
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (rtl) goNext();
      else goPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      if (rtl) goPrev();
      else goNext();
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(images.length - 1);
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
    const rtl = isRtlDoc();
    if (dx > 0) {
      if (rtl) goNext();
      else goPrev();
    } else if (rtl) goPrev();
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
    <>
      <div
        ref={galleryRef}
        role="region"
        aria-labelledby={labelId}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className={cn(
          "outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2",
          className,
        )}
      >
        <h2 id={labelId} className="sr-only">
          {labels.gallery}
        </h2>

        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-zinc-200 sm:aspect-[2/1]">
          {images.map((image, i) => {
            if (!loaded[i] && i !== safeIndex) return null;
            const active = i === safeIndex;
            const isFailed = failedIds.has(image.id);
            return (
              <div
                key={image.id}
                className={cn(
                  "gallery-fade absolute inset-0 transition-opacity duration-300",
                  active ? "opacity-100" : "pointer-events-none opacity-0",
                )}
                aria-hidden={!active}
              >
                {isFailed ? (
                  <p className="flex h-full items-center justify-center px-6 text-center text-sm text-[var(--brand-gray)]">
                    {labels.imageFailed}
                  </p>
                ) : (
                  <SoftImage
                    src={image.url}
                    alt={active ? image.alt : ""}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1280px"
                    priority={i === 0}
                    onError={() => markFailed(image.id)}
                    className="object-cover object-center"
                  />
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label={labels.enlarge}
            className="absolute top-3 end-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-md bg-black/55 text-white transition-colors hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ExpandIcon />
          </button>

          {multi ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label={labels.previous}
                className="absolute start-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]"
              >
                <Chevron dir="prev" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label={labels.next}
                className="absolute end-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]"
              >
                <Chevron dir="next" />
              </button>
              <div className="absolute bottom-3 end-3 z-10 rounded-full bg-black/60 px-3 py-1 text-xs font-medium tracking-wide text-white">
                {counter}
              </div>
            </>
          ) : null}
        </div>

        {multi ? (
          <div
            ref={thumbsRef}
            className="mt-3 overflow-x-auto pb-1"
            role="tablist"
            aria-label={labels.gallery}
          >
            <div className="flex w-max min-w-full justify-center gap-2">
              {images.map((image, i) => {
                const selected = i === safeIndex;
                return (
                  <button
                    key={image.id}
                    type="button"
                    role="tab"
                    data-thumb-index={i}
                    aria-selected={selected}
                    aria-label={labels.goToImage.replace("{n}", String(i + 1))}
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
        ) : null}
      </div>

      {lightboxOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={labels.enlarge}
          className="fixed inset-0 z-[100] flex flex-col bg-black/90"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
            <p className="text-sm tracking-wide">{counter}</p>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label={labels.close}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/40 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <CloseIcon />
            </button>
          </div>
          <div
            className="relative flex flex-1 items-center justify-center px-4 pb-8"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {failed ? (
              <p className="text-sm text-white/80">{labels.imageFailed}</p>
            ) : (
              <SoftImage
                src={current.url}
                alt={current.alt}
                width={1600}
                height={1200}
                sizes="100vw"
                priority
                className="max-h-[calc(100dvh-6rem)] max-w-full object-contain"
              />
            )}
            {multi ? (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label={labels.previous}
                  className="absolute start-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <Chevron dir="prev" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label={labels.next}
                  className="absolute end-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <Chevron dir="next" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function Chevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden
      className={cn("stroke-current", dir === "next" && "rtl:rotate-180", dir === "prev" && "rtl:rotate-180")}
    >
      {dir === "prev" ? (
        <path d="M11 4.5L6.5 9l4.5 4.5" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M7 4.5L11.5 9 7 13.5" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M3 7V3h4M15 7V3h-4M3 11v4h4M15 11v4h-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
