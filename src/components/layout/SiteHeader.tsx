import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { MainNavigation } from "@/components/layout/MainNavigation";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { sitePath } from "@/i18n/pathnames";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type Props = {
  locale: Locale;
  dict: Dictionary;
};

/**
 * Fixed floating glass capsule over page content (transparent shell — no band).
 * Always visible while scrolling. Clearance lives inside heroes / `.public-main-offset`.
 */
export function SiteHeader({ locale, dict }: Props) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 w-full">
      <div
        className="pointer-events-auto px-3 sm:px-5 lg:px-6"
        style={{
          paddingTop: "var(--site-header-top-gap)",
          paddingBottom: "var(--site-header-bottom-gap)",
        }}
      >
        <div
          className="glass-panel mx-auto flex w-full items-center gap-2 rounded-full px-3 pe-3 ps-2.5 sm:gap-3 sm:px-4 sm:pe-4 sm:ps-3"
          style={{ minHeight: "var(--site-header-bar-height)" }}
        >
          <Link
            href={sitePath("/", locale)}
            className="shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span className="inline-flex items-center justify-center rounded-full bg-white p-1 shadow-sm ring-1 ring-white/70 sm:p-1.5">
              <Image
                src="/images/agenda-logo.png"
                alt={dict.nav.logoAlt}
                width={1149}
                height={1604}
                sizes="36px"
                className="h-8 w-auto sm:h-9"
                priority
              />
            </span>
          </Link>

          <MainNavigation
            labels={dict.nav}
            locale={locale}
            className="ms-1 hidden min-w-0 flex-1 justify-center md:flex"
          />

          <div className="ms-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <Suspense fallback={null}>
              <LanguageSwitcher
                locale={locale}
                label={dict.nav.language}
                tone="onGlass"
              />
            </Suspense>
            <MobileNavigation labels={dict.nav} locale={locale} />
          </div>
        </div>
      </div>
    </header>
  );
}
