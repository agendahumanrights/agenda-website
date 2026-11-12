import type { Metadata } from "next";

import { AccentHeading } from "@/components/about/AccentHeading";
import { FounderBiography } from "@/components/about/FounderBiography";
import { OrganizationIntro } from "@/components/about/OrganizationIntro";
import { Container } from "@/components/layout/Container";
import { PageHero } from "@/components/layout/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { EmptyState } from "@/components/ui/EmptyState";
import { PAGE_HEROES } from "@/content/page-heroes";
import { getOrganizationCopy } from "@/content/about";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { sitePath } from "@/i18n/pathnames";
import { breadcrumbJsonLd, organizationJsonLd } from "@/lib/seo/json-ld";
import { absoluteLocalizedUrl } from "@/lib/seo/locale-url";
import { aboutPageMetadata } from "@/lib/seo/page-metadata";
import { listFounderBiographies } from "@/server/services/founders";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return aboutPageMetadata(locale);
}

export default async function AboutPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const founders = await listFounderBiographies(locale);
  const org = getOrganizationCopy(locale);

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(dict.meta.siteName),
          breadcrumbJsonLd([
            {
              name: dict.nav.home,
              url: absoluteLocalizedUrl("/", locale),
            },
            {
              name: dict.about.title,
              url: absoluteLocalizedUrl("/about", locale),
            },
          ]),
        ]}
      />
      <PageHero
        title={dict.about.title}
        description={dict.about.heroDescription}
        image={PAGE_HEROES.about}
        breadcrumbLabel={dict.shared.breadcrumbNav}
        breadcrumbs={[
          { label: dict.nav.home, href: sitePath("/", locale) },
          { label: dict.about.title },
        ]}
        contentBackgroundClassName="bg-[color-mix(in_srgb,var(--brand-blue)_3%,white)]"
      />
      <div className="bg-[color-mix(in_srgb,var(--brand-blue)_3%,white)]">
        <Container className="flex flex-col gap-14 pt-10 pb-10 sm:gap-16 sm:pt-12 sm:pb-14 lg:gap-20 lg:pt-14">
          <OrganizationIntro copy={org} labels={dict.about} />

          <section
            id="about-founders"
            aria-labelledby="founders-heading"
            className="anchor-offset flex w-full flex-col gap-8 sm:gap-10 lg:gap-12"
          >
            <AccentHeading id="founders-heading">
              {dict.about.founders}
            </AccentHeading>

            {founders.length === 0 ? (
              <EmptyState title={dict.about.foundersPending} />
            ) : (
              <ul className="flex w-full flex-col gap-10 sm:gap-12 lg:gap-14 xl:gap-16">
                {founders.map((founder, index) => (
                  <li key={founder.id} className="w-full">
                    <FounderBiography
                      founder={founder}
                      reverse={index % 2 === 1}
                      emailLabel={dict.about.founderEmail}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Container>
      </div>
    </>
  );
}
