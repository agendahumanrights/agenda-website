import Image from "next/image";
import Link from "next/link";

import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { LogoutButton } from "@/components/admin/LogoutButton";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { AdminSession } from "@/server/auth/types";

type Props = {
  title: string;
  locale: Locale;
  dict: Dictionary;
  admin: AdminSession;
  onOpenNav?: () => void;
  navOpen?: boolean;
};

/** Full-viewport-width sticky header (not constrained by content max-width). */
export function AdminHeader({
  title,
  locale,
  dict,
  admin,
  onOpenNav,
}: Props) {
  const display = admin.name?.trim() || admin.email;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--admin-border)] bg-white/95 backdrop-blur-sm">
      <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {onOpenNav ? (
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--admin-border)] text-[var(--admin-text)] hover:bg-zinc-50 lg:hidden"
              aria-label={dict.nav.openMenu}
              onClick={onOpenNav}
            >
              <span className="flex flex-col gap-1.5" aria-hidden>
                <span className="block h-0.5 w-5 bg-current" />
                <span className="block h-0.5 w-5 bg-current" />
                <span className="block h-0.5 w-5 bg-current" />
              </span>
            </button>
          ) : null}

          <Link
            href="/admin"
            className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]"
          >
            <span className="inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[var(--admin-border)]">
              <Image
                src="/images/agenda-logo.png"
                alt={dict.nav.logoAlt}
                width={1149}
                height={1604}
                className="h-7 w-auto"
                priority
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-[var(--admin-text)] sm:text-base">
                {title}
              </span>
              <span className="block truncate text-xs text-[var(--admin-muted)]">
                {dict.admin.signedInAs} {display}
              </span>
            </span>
          </Link>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
          <LanguageSwitcher locale={locale} label={dict.nav.language} />
          <LogoutButton labels={dict.admin} />
        </div>
      </div>
    </header>
  );
}
