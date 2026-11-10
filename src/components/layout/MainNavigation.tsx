"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  className?: string;
};

export function MainNavigation({ labels, locale, className }: Props) {
  const pathname = usePathname() || "/";
  const items = getMainNavItems(labels, locale);

  return (
    <nav
      aria-label={labels.mainNav}
      className={cn("items-center gap-1.5 lg:gap-2", className)}
    >
      {items.map((item) => {
        const active = isNavItemActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            data-active={active ? "true" : undefined}
            className={cn(
              "glass-nav-pill whitespace-nowrap rounded-full px-3 py-1.5 text-sm tracking-wide transition",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
              "lg:px-3.5 lg:py-2",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
