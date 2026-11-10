import type { Locale } from "@/i18n/config";
import { sitePath } from "@/i18n/pathnames";
import type { Dictionary } from "@/i18n/dictionaries";

export type NavItem = {
  href: string;
  label: string;
};

export function getMainNavItems(
  labels: Dictionary["nav"],
  locale?: Locale,
): NavItem[] {
  return [
    { href: sitePath("/", locale), label: labels.home },
    { href: sitePath("/publications", locale), label: labels.publications },
    { href: sitePath("/events", locale), label: labels.events },
    { href: sitePath("/about", locale), label: labels.about },
  ];
}

/** Exact match for home; prefix match for nested public routes. */
export function isNavItemActive(pathname: string, href: string): boolean {
  const pathOnly = href.split("?")[0] || "/";
  if (pathOnly === "/") return pathname === "/";
  return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
}
