"use client";

import { useEffect, useId, useState } from "react";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { AdminSession } from "@/server/auth/types";

type Props = {
  locale: Locale;
  dict: Dictionary;
  admin: AdminSession;
  children: React.ReactNode;
};

/**
 * Full-bleed admin chrome: sidebar flush to the viewport start edge;
 * content max-width lives only inside `<main>`.
 */
export function AdminShell({ locale, dict, admin, children }: Props) {
  const [navOpen, setNavOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  return (
    <div className="admin-shell flex min-h-dvh flex-col">
      <AdminHeader
        title={dict.admin.title}
        locale={locale}
        dict={dict}
        admin={admin}
        onOpenNav={() => setNavOpen(true)}
        navOpen={navOpen}
      />
      <div className="flex min-h-0 flex-1">
        <AdminSidebar
          labels={dict.admin}
          className="hidden lg:flex"
        />
        <main className="min-w-0 flex-1 bg-[var(--admin-bg)]">
          <div className="mx-auto w-full max-w-[1440px] px-6 py-6 sm:px-7 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      {navOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={dict.nav.closeMenu}
            onClick={() => setNavOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-y-0 start-0 flex w-[min(20rem,88vw)] flex-col bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-4 py-3">
              <p id={titleId} className="font-semibold text-[var(--admin-text)]">
                {dict.admin.title}
              </p>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-[var(--admin-muted)] hover:bg-zinc-100"
                onClick={() => setNavOpen(false)}
              >
                {dict.nav.closeMenu}
              </button>
            </div>
            <AdminSidebar
              labels={dict.admin}
              className="flex-1 border-0"
              onNavigate={() => setNavOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
