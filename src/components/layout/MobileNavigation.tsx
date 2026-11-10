"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import {
  getMainNavItems,
  isNavItemActive,
} from "@/components/layout/nav-items";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

type Props = {
  labels: Dictionary["nav"];
  locale: Locale;
};

export function MobileNavigation({ labels, locale }: Props) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const items = getMainNavItems(labels, locale);

  const close = useCallback(() => {
    setOpen(false);
    queueMicrotask(() => buttonRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const firstLink = panelRef.current?.querySelector<HTMLElement>("a");
    firstLink?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  function onPanelKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab" || !panelRef.current) return;

    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled])",
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

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? labels.closeMenu : labels.openMenu}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "glass-icon-btn inline-flex size-10 items-center justify-center rounded-full transition",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        )}
      >
        <span className="sr-only">
          {open ? labels.closeMenu : labels.openMenu}
        </span>
        <MenuIcon open={open} />
      </button>

      {open ? (
        <>
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            className="fixed inset-0 z-[45] bg-black/45"
            onClick={close}
          />
          <nav
            ref={panelRef}
            id={panelId}
            aria-label={labels.mainNav}
            onKeyDown={onPanelKeyDown}
            className={cn(
              "glass-panel fixed inset-x-3 z-[55] flex max-h-[min(70dvh,calc(100dvh-var(--site-header-height)-1rem))] flex-col gap-1 overflow-y-auto rounded-3xl p-3 shadow-lg sm:inset-x-5",
            )}
            style={{ top: "var(--site-header-height)" }}
          >
            {items.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  data-active={active ? "true" : undefined}
                  onClick={close}
                  className={cn(
                    "glass-nav-pill rounded-2xl px-4 py-3 text-base transition",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </>
      ) : null}
    </div>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="stroke-current"
    >
      {open ? (
        <path
          d="M5 5l10 10M15 5L5 15"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      ) : (
        <>
          <path d="M3.5 5.5h13" strokeWidth="1.75" strokeLinecap="round" />
          <path d="M3.5 10h13" strokeWidth="1.75" strokeLinecap="round" />
          <path d="M3.5 14.5h13" strokeWidth="1.75" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
