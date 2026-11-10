"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

type Props = {
  labels: Dictionary["admin"];
  className?: string;
  onNavigate?: () => void;
};

const LINKS = [
  { href: "/admin", key: "dashboard" as const, icon: DashboardIcon },
  {
    href: "/admin/publications",
    key: "publications" as const,
    icon: PublicationsIcon,
  },
  { href: "/admin/events", key: "events" as const, icon: EventsIcon },
  { href: "/admin/founders", key: "founders" as const, icon: FoundersIcon },
  { href: "/admin/homepage", key: "homepage" as const, icon: HomepageIcon },
];

/** Longest-prefix match so /admin/events wins over /admin, never over homepage. */
function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({ labels, className, onNavigate }: Props) {
  const pathname = usePathname() || "/admin";

  return (
    <aside
      className={cn(
        "admin-sidebar w-60 shrink-0 flex-col border-e border-[var(--admin-border)] bg-white",
        className,
      )}
    >
      <nav
        aria-label={labels.title}
        className="flex flex-col gap-1 p-3 sm:p-4"
      >
        {LINKS.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "inline-flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--admin-accent-soft)] text-[var(--brand-blue)]"
                  : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "size-5 shrink-0",
                  active ? "text-[var(--brand-blue)]" : "text-zinc-500",
                )}
              />
              <span>{labels[item.key]}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PublicationsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M5 3.5h7.5L15.5 6v10.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M12.5 3.5V6H15.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 9.5h6M7 12.5h6M7 15.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function EventsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <rect x="3" y="4.5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 8.5h14M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FoundersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4.5 16.5c1.2-3 3.2-4.5 5.5-4.5s4.3 1.5 5.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HomepageIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path
        d="M3.5 9.5 10 3.5l6.5 6V16a1 1 0 0 1-1 1h-3.5v-4.5H8V17H4.5a1 1 0 0 1-1-1V9.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
