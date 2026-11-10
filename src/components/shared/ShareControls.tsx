"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

export type ShareLabels = {
  share: string;
  shareOnX: string;
  shareOnFacebook: string;
  shareOnLinkedIn: string;
  shareByEmail: string;
  copyLink: string;
  copySuccess: string;
  copyFailed: string;
};

type Props = {
  title: string;
  path: string;
  labels: ShareLabels;
  className?: string;
};

function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (typeof window === "undefined") return normalized;
  return `${window.location.origin}${normalized}`;
}

const actionClass =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center text-zinc-600 transition-colors hover:text-[var(--brand-blue)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]";

/**
 * Expandable share menu: circular trigger + horizontal action pill.
 * Used on publication and event detail pages.
 */
export function ShareControls({ title, path, labels, className }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) {
      queueMicrotask(() => triggerRef.current?.focus());
    }
  }, []);

  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => setStatus("idle"), 2500);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && rootRef.current?.contains(target)) return;
      close(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const encodedTitle = encodeURIComponent(title);
  // Path-only in markup for SSR/hydration stability; absolute URL applied on click.
  const pathForHref = path.startsWith("/") ? path : `/${path}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(absoluteUrl(path));
      setStatus("ok");
    } catch {
      setStatus("err");
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div ref={rootRef} className="relative inline-flex items-center self-start">
        <button
          ref={triggerRef}
          type="button"
          aria-label={labels.share}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--brand-gray)]",
            "shadow-[0_4px_14px_rgba(5,73,140,0.12)] ring-1 ring-zinc-200/80",
            "transition-colors hover:text-[var(--brand-blue)]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]",
            open && "text-[var(--brand-blue)]",
          )}
        >
          <ShareIcon />
        </button>

        <div
          id={menuId}
          role="menu"
          aria-label={labels.share}
          aria-hidden={!open}
          inert={open ? undefined : true}
          className={cn(
            "absolute z-20",
            // Desktop: open beside the trigger toward inline-end
            "top-1/2 start-full ms-3 -translate-y-1/2",
            // Mobile: open below to avoid horizontal overflow
            "max-sm:start-0 max-sm:ms-0 max-sm:top-full max-sm:mt-3 max-sm:translate-y-0",
            "origin-left rtl:origin-right max-sm:origin-top max-sm:rtl:origin-top",
            "motion-safe:transition-[opacity,transform] motion-safe:duration-200 motion-safe:ease-out",
            open
              ? "pointer-events-auto opacity-100 motion-safe:scale-100"
              : "pointer-events-none opacity-0 motion-safe:scale-95",
            "motion-reduce:transition-none motion-reduce:scale-100",
          )}
        >
          <div
            className={cn(
              "relative flex items-center rounded-full bg-white px-1.5 py-1",
              "shadow-[0_8px_24px_rgba(5,73,140,0.14)] ring-1 ring-zinc-200/70",
              "max-w-[calc(100vw-2rem)]",
            )}
          >
            {/* Side pointer (desktop) */}
            <span
              aria-hidden
              className={cn(
                "absolute top-1/2 hidden size-0 -translate-y-1/2 sm:block",
                "end-full border-y-[7px] border-y-transparent border-e-[8px] border-e-white",
                "drop-shadow-[-1px_0_0_rgba(228,228,231,0.9)]",
              )}
            />
            {/* Top pointer (mobile) */}
            <span
              aria-hidden
              className={cn(
                "absolute start-5 bottom-full size-0 sm:hidden",
                "border-x-[7px] border-x-transparent border-b-[8px] border-b-white",
                "drop-shadow-[0_-1px_0_rgba(228,228,231,0.9)]",
              )}
            />

            <a
              role="menuitem"
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(pathForHref)}&text=${encodedTitle}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={labels.shareOnX}
              className={actionClass}
              onClick={(event) => {
                event.currentTarget.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(absoluteUrl(path))}&text=${encodedTitle}`;
              }}
            >
              <XIcon />
            </a>
            <Separator />
            <a
              role="menuitem"
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pathForHref)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={labels.shareOnFacebook}
              className={cn(actionClass, "text-[#1877F2] hover:text-[#0d65d9]")}
              onClick={(event) => {
                event.currentTarget.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(absoluteUrl(path))}`;
              }}
            >
              <FacebookIcon />
            </a>
            <Separator />
            <a
              role="menuitem"
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pathForHref)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={labels.shareOnLinkedIn}
              className={cn(actionClass, "text-[#0A66C2] hover:text-[#084d92]")}
              onClick={(event) => {
                event.currentTarget.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(absoluteUrl(path))}`;
              }}
            >
              <LinkedInIcon />
            </a>
            <Separator />
            <a
              role="menuitem"
              href={`mailto:?subject=${encodedTitle}&body=${encodeURIComponent(pathForHref)}`}
              aria-label={labels.shareByEmail}
              className={actionClass}
              onClick={(event) => {
                event.currentTarget.href = `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(absoluteUrl(path))}`;
              }}
            >
              <EmailIcon />
            </a>
            <Separator />
            <button
              type="button"
              role="menuitem"
              onClick={copyLink}
              aria-label={labels.copyLink}
              className={actionClass}
            >
              <LinkIcon />
            </button>
          </div>
        </div>
      </div>

      <p
        className="min-h-5 text-xs text-[var(--brand-blue)]"
        role="status"
        aria-live="polite"
      >
        {status === "ok"
          ? labels.copySuccess
          : status === "err"
            ? labels.copyFailed
            : null}
      </p>
    </div>
  );
}

function Separator() {
  return <span aria-hidden className="h-5 w-px shrink-0 bg-zinc-200" />;
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="13.5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="4.5" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="13.5" cy="13.5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.3 8.1 11.7 5.4M6.3 9.9l5.4 2.7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M9.54 6.77 14.3 1.5h-1.13L9.03 6.07 5.7 1.5H1.5l5 7.2L1.5 14.5h1.13l4.37-5.02L10.3 14.5h4.2L9.54 6.77Zm-1.55 1.78-.5-.73L3.06 2.35h1.73l3.23 4.64.5.73 4.2 6.03h-1.73L7.99 8.55Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M10.5 2.5H12V.1C11.74.07 10.82 0 9.75 0 7.52 0 6 1.35 6 3.82V6H3.5v2.7H6V16h2.8V8.7h2.32L11.5 6H8.8V4.1c0-.78.22-1.6 1.7-1.6Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M3.5 5.5H1V15h2.5V5.5ZM2.25 1C1.4 1 .75 1.65.75 2.5S1.4 4 2.25 4 3.75 3.35 3.75 2.5 3.1 1 2.25 1ZM15 15h-2.5v-4.6c0-1.1 0-2.5-1.55-2.5s-1.8 1.2-1.8 2.42V15H6.7V5.5h2.4v1.3h.03c.33-.63 1.15-1.3 2.37-1.3 2.54 0 3 1.67 3 3.84V15Z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 4.5 8 9l6-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M6.8 9.2a3 3 0 0 0 4.24 0l1.42-1.42a3 3 0 0 0-4.24-4.24L7.4 4.36"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9.2 6.8a3 3 0 0 0-4.24 0L3.54 8.22a3 3 0 0 0 4.24 4.24L8.6 11.64"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
