import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";

import {
  FacebookIcon,
  LinkedInIcon,
  YouTubeIcon,
} from "@/components/layout/SocialIcons";
import { getOrganizationCopy } from "@/content/about";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { sitePath } from "@/i18n/pathnames";

type Props = {
  locale: Locale;
  dict: Dictionary;
};

const SOCIAL_LINKS = [
  {
    href: "https://www.facebook.com/agenda4hr",
    labelKey: "socialFacebook" as const,
    Icon: FacebookIcon,
  },
  {
    href: "https://www.linkedin.com/company/agenda4hr",
    labelKey: "socialLinkedIn" as const,
    Icon: LinkedInIcon,
  },
  {
    href: "https://www.youtube.com/@Agenda4hr",
    labelKey: "socialYouTube" as const,
    Icon: YouTubeIcon,
  },
];

async function CopyrightYear() {
  await connection();
  return <>{new Date().getFullYear()}</>;
}

export function SiteFooter({ locale, dict }: Props) {
  const org = getOrganizationCopy(locale);
  const primaryLinks = [
    { href: sitePath("/", locale), label: dict.nav.home },
    { href: sitePath("/publications", locale), label: dict.nav.publications },
    { href: sitePath("/events", locale), label: dict.nav.events },
    { href: sitePath("/about", locale), label: dict.nav.about },
  ];
  const aboutLinks = [
    {
      href: `${sitePath("/about", locale)}#about-vision`,
      label: dict.footer.vision,
    },
    {
      href: `${sitePath("/about", locale)}#about-mission`,
      label: dict.footer.mission,
    },
    {
      href: `${sitePath("/about", locale)}#about-founders`,
      label: dict.footer.founders,
    },
  ];

  return (
    <footer className="relative mt-auto overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,color-mix(in_srgb,var(--brand-blue)_22%,#e8eef5)_0%,#d5dee8_48%,color-mix(in_srgb,var(--brand-blue)_12%,#eef2f6)_100%)]"
        aria-hidden
      />
      <div className="relative px-3 py-8 sm:px-5 sm:py-10 lg:px-6 lg:py-12">
        <div className="glass-panel mx-auto w-full overflow-hidden rounded-[1.75rem] sm:rounded-[2rem]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_auto]">
            {/* Brand */}
            <div className="flex flex-col gap-5 p-6 sm:p-8 lg:p-9">
              <Link
                href={sitePath("/", locale)}
                className="inline-flex w-fit items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span className="inline-flex items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-white/70">
                  <Image
                    src="/images/agenda-logo.png"
                    alt={dict.nav.logoAlt}
                    width={1149}
                    height={1604}
                    className="h-10 w-auto"
                  />
                </span>
                <span className="font-editorial text-lg font-semibold tracking-tight text-white sm:text-xl">
                  {dict.meta.siteName}
                </span>
              </Link>
              <p className="max-w-md text-base leading-relaxed text-white/85 text-pretty sm:text-[1.05rem]">
                {org.missionSummary}
              </p>
            </div>

            {/* Navigation — desktop vertical divider */}
            <div className="border-t border-white/15 p-6 sm:p-8 lg:border-t-0 lg:border-s lg:p-9">
              <p className="mb-4 text-xs font-semibold tracking-[0.14em] text-white/55 uppercase">
                {dict.footer.explore}
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:gap-x-10">
                <ul className="flex flex-col gap-1">
                  {primaryLinks.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="inline-flex min-h-10 items-center rounded-md text-sm text-white/90 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-[0.95rem]"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <ul className="flex flex-col gap-1">
                  {aboutLinks.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="inline-flex min-h-10 items-center rounded-md text-sm text-white/90 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-[0.95rem]"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Social */}
            <div className="border-t border-white/15 p-6 sm:p-8 lg:border-t-0 lg:border-s lg:p-9">
              <p className="mb-4 text-xs font-semibold tracking-[0.14em] text-white/55 uppercase lg:sr-only">
                {dict.footer.social}
              </p>
              <ul className="flex flex-row gap-3 lg:flex-col lg:gap-3">
                {SOCIAL_LINKS.map(({ href, labelKey, Icon }) => (
                  <li key={href}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={dict.footer[labelKey]}
                      className="glass-icon-btn inline-flex size-11 items-center justify-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      <Icon className="size-5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/15 px-6 py-4 sm:px-8 lg:px-9">
            <div className="flex flex-col gap-1 text-sm text-white/65 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <p>
                ©{" "}
                <Suspense fallback="…">
                  <CopyrightYear />
                </Suspense>{" "}
                {dict.meta.siteName}. {dict.footer.rights}
              </p>
              <p>
                <a
                  href={`https://${dict.footer.domain}`}
                  className="rounded-sm transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {dict.footer.domain}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
