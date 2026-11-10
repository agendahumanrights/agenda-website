import type { Metadata } from "next";
import { Suspense } from "react";

import { FeaturedEventsSection } from "@/components/home/FeaturedEventsSection";
import { FeaturedPublicationsSlider } from "@/components/home/FeaturedPublicationsSlider";
import { HomeAboutSection } from "@/components/home/HomeAboutSection";
import { PublicationGrid } from "@/components/home/PublicationGrid";
import { SectionHeader } from "@/components/home/SectionHeader";
import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { LoadingState } from "@/components/ui/LoadingState";
import { getOrganizationCopy } from "@/content/about";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { sitePath } from "@/i18n/pathnames";
import {
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/json-ld";
import { homePageMetadata } from "@/lib/seo/page-metadata";
import {
  getFeaturedEvents,
  getFeaturedPublications,
} from "@/server/services/homepage";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return homePageMetadata(locale);
}

async function HomeContent() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const [featuredPublications, featuredEvents] = await Promise.all([
    getFeaturedPublications(locale),
    getFeaturedEvents(locale),
  ]);
  const org = getOrganizationCopy(locale);

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(dict.meta.siteName),
          websiteJsonLd({
            siteName: dict.meta.siteName,
            description: dict.meta.siteDescription,
            locale,
          }),
        ]}
      />
      <FeaturedPublicationsSlider
        locale={locale}
        items={featuredPublications}
        labels={dict.home}
        categoryLabels={dict.publications}
      />

      <section
        aria-labelledby="home-pubs-heading"
        className="bg-white py-10 sm:py-12 lg:py-[4.5rem]"
      >
        <Container className="flex flex-col gap-6 sm:gap-7 lg:gap-8">
          <SectionHeader
            id="home-pubs-heading"
            label={dict.home.publicationsSectionLabel}
            title={dict.home.publicationsCatalogue}
            description={dict.home.publicationsSectionDescription}
            action={{
              href: sitePath("/publications", locale),
              label: dict.home.viewAllPublications,
            }}
          />
          <PublicationGrid
            locale={locale}
            items={featuredPublications}
            emptyLabel={dict.publications.empty}
            categoryLabels={dict.publications}
            readMoreLabel={dict.publications.readMore}
            variant="home"
          />
        </Container>
      </section>

      <section
        aria-labelledby="featured-events-heading"
        className="bg-[color-mix(in_srgb,var(--brand-gray)_8%,white)] py-10 sm:py-12 lg:py-[4.5rem]"
      >
        <Container>
          <FeaturedEventsSection
            locale={locale}
            items={featuredEvents}
            labels={dict.home}
            eventLabels={dict.events}
            emptyLabel={dict.home.eventsEmpty}
          />
        </Container>
      </section>

      <section className="bg-white py-10 sm:py-12 lg:py-[4.5rem]">
        <Container>
          <HomeAboutSection
            locale={locale}
            org={org}
            siteName={dict.meta.siteName}
            logoAlt={dict.nav.logoAlt}
            labels={dict.home}
          />
        </Container>
      </section>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <HomeContent />
    </Suspense>
  );
}
