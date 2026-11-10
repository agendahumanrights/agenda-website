import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/Container";
import { PublicationDetails } from "@/components/publications/PublicationDetails";
import { JsonLd } from "@/components/seo/JsonLd";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import {
  articleJsonLd,
  breadcrumbJsonLd,
} from "@/lib/seo/json-ld";
import { absoluteLocalizedUrl } from "@/lib/seo/locale-url";
import { publicationDetailMetadata } from "@/lib/seo/page-metadata";
import { isDatabaseConfigured } from "@/server/db";
import { AppError } from "@/server/http/errors";
import { getPublishedPublicationBySlug } from "@/server/services/publications";
import { getPublicationLocalesForSlug } from "@/server/services/seo-sitemap";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  if (!isDatabaseConfigured()) {
    return { title: dict.publications.title, robots: { index: false } };
  }

  try {
    const [publication, availableLocales] = await Promise.all([
      getPublishedPublicationBySlug(locale, slug),
      getPublicationLocalesForSlug(slug),
    ]);
    return publicationDetailMetadata({
      locale,
      siteName: dict.meta.siteName,
      publication,
      availableLocales:
        availableLocales.length > 0 ? availableLocales : [locale],
    });
  } catch {
    return { title: dict.publications.title, robots: { index: false } };
  }
}

export default async function PublicationDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  if (!isDatabaseConfigured()) {
    return (
      <div className="public-main-offset min-h-[50vh] bg-white">
        <Container className="pb-10 sm:pb-12">
          <EmptyState
            title={dict.publications.title}
            description={dict.publications.detailsPlaceholder}
          />
        </Container>
      </div>
    );
  }

  let publication;
  try {
    publication = await getPublishedPublicationBySlug(locale, slug);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const pageUrl = absoluteLocalizedUrl(
    `/publications/${publication.slug}`,
    locale,
  );
  const description =
    publication.subtitle?.trim() || publication.title;

  return (
    <div className="public-main-offset bg-white">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            {
              name: dict.nav.home,
              url: absoluteLocalizedUrl("/", locale),
            },
            {
              name: dict.publications.title,
              url: absoluteLocalizedUrl("/publications", locale),
            },
            { name: publication.title, url: pageUrl },
          ]),
          articleJsonLd({
            locale,
            siteName: dict.meta.siteName,
            headline: publication.title,
            description,
            url: pageUrl,
            imageUrl: publication.mainImageUrl,
            datePublished: publication.publishedAt,
            authorName: publication.authorName,
            type: publication.category.requiresAuthor
              ? "BlogPosting"
              : "Article",
          }),
        ]}
      />
      <Container className="pb-10 sm:pb-12">
        <PublicationDetails
          locale={locale}
          publication={publication}
          labels={dict.publications}
          shared={dict.shared}
          navHome={dict.nav.home}
        />
      </Container>
    </div>
  );
}
