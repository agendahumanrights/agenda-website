import Image from "next/image";
import Link from "next/link";

import {
  sectionActionClassName,
  sectionLabelClassName,
  sectionTitleClassName,
} from "@/components/home/SectionHeader";
import type { OrganizationCopy } from "@/content/about";
import type { Locale } from "@/i18n/config";
import { sitePath } from "@/i18n/pathnames";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

type Props = {
  locale: Locale;
  org: OrganizationCopy;
  siteName: string;
  logoAlt: string;
  labels: Dictionary["home"];
};

export function HomeAboutSection({
  locale,
  org,
  siteName,
  logoAlt,
  labels,
}: Props) {
  return (
    <section
      aria-labelledby="home-about-heading"
      className="rounded-3xl bg-[color-mix(in_srgb,var(--brand-blue)_4%,white)] px-5 py-8 ring-1 ring-[color-mix(in_srgb,var(--brand-blue)_8%,transparent)] sm:px-8 sm:py-10 lg:px-10 lg:py-12"
    >
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-14">
        <div className="flex flex-col gap-4 sm:gap-5">
          <p className={sectionLabelClassName}>{labels.aboutSectionLabel}</p>
          <h2 id="home-about-heading" className={cn(sectionTitleClassName, "mt-0")}>
            {siteName}
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-zinc-800 text-pretty sm:text-lg">
            {org.vision}
          </p>
          <p className="max-w-xl text-[0.9375rem] leading-relaxed text-[var(--brand-gray)] text-pretty sm:text-base">
            {org.missionSummary}
          </p>
          <Link
            href={sitePath("/about", locale)}
            className={cn(sectionActionClassName, "mt-1")}
          >
            <span>{labels.aboutCta}</span>
            <span aria-hidden className="rtl:rotate-180">
              →
            </span>
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none lg:justify-self-stretch">
          <div
            className="pointer-events-none absolute -top-2 -end-2 h-12 w-12 rounded-full bg-[color-mix(in_srgb,var(--brand-blue)_14%,white)] sm:h-14 sm:w-14"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-3 -start-2 h-10 w-10 rounded-full bg-[color-mix(in_srgb,var(--brand-gray)_18%,white)] sm:h-12 sm:w-12"
            aria-hidden
          />
          <div className="relative flex aspect-[5/4] items-center justify-center rounded-2xl bg-white p-6 shadow-[0_10px_28px_rgba(5,73,140,0.1)] ring-1 ring-[color-mix(in_srgb,var(--brand-blue)_8%,transparent)] sm:aspect-square sm:p-8 lg:p-10">
            <Image
              src="/images/agenda-logo.png"
              alt={logoAlt}
              width={1149}
              height={1604}
              className="h-auto max-h-full w-auto max-w-[72%] object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
