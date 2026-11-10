import type { Metadata } from "next";

import { getOrganizationCopy } from "@/content/about";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { LOCALES } from "@/i18n/config";
import { catalogueHasIndexableFilters } from "@/lib/catalogue-query";
import { buildMetaDescription } from "@/lib/seo/excerpt";
import {
  buildPageMetadata,
  titleWithSite,
} from "@/lib/seo/metadata";
import type { CatalogueDateSort } from "@/lib/catalogue-query";
import type { EventDetail } from "@/types/event";
import type { PublicationDetail } from "@/types/publication";

export async function homePageMetadata(locale: Locale): Promise<Metadata> {
  const dict = await getDictionary(locale);
  return buildPageMetadata({
    locale,
    pathname: "/",
    title: dict.meta.siteName,
    description: dict.meta.siteDescription,
    availableLocales: LOCALES,
    siteName: dict.meta.siteName,
    ogType: "website",
  });
}

export async function publicationsListingMetadata(
  locale: Locale,
  filters: { q?: string; category?: string; sort: CatalogueDateSort },
): Promise<Metadata> {
  const dict = await getDictionary(locale);
  return buildPageMetadata({
    locale,
    pathname: "/publications",
    title: titleWithSite(dict.publications.title, dict.meta.siteName),
    description: dict.publications.heroDescription,
    availableLocales: LOCALES,
    siteName: dict.meta.siteName,
    noIndex: catalogueHasIndexableFilters(filters),
  });
}

export async function eventsListingMetadata(
  locale: Locale,
  filters: { q?: string; sort: CatalogueDateSort },
): Promise<Metadata> {
  const dict = await getDictionary(locale);
  return buildPageMetadata({
    locale,
    pathname: "/events",
    title: titleWithSite(dict.events.title, dict.meta.siteName),
    description: dict.events.heroDescription,
    availableLocales: LOCALES,
    siteName: dict.meta.siteName,
    noIndex: catalogueHasIndexableFilters(filters),
  });
}

export async function aboutPageMetadata(locale: Locale): Promise<Metadata> {
  const dict = await getDictionary(locale);
  const org = getOrganizationCopy(locale);
  return buildPageMetadata({
    locale,
    pathname: "/about",
    title: titleWithSite(dict.about.title, dict.meta.siteName),
    description: buildMetaDescription({
      subtitle: dict.about.heroDescription,
      descriptionMarkdown: org.intro,
      fallback: dict.meta.siteDescription,
    }),
    availableLocales: LOCALES,
    siteName: dict.meta.siteName,
  });
}

export function publicationDetailMetadata(input: {
  locale: Locale;
  siteName: string;
  publication: PublicationDetail;
  availableLocales: readonly Locale[];
}): Metadata {
  const description = buildMetaDescription({
    subtitle: input.publication.subtitle,
    descriptionMarkdown: input.publication.description,
    fallback: input.publication.title,
  });
  return buildPageMetadata({
    locale: input.locale,
    pathname: `/publications/${input.publication.slug}`,
    title: titleWithSite(input.publication.title, input.siteName),
    description,
    availableLocales: input.availableLocales,
    siteName: input.siteName,
    ogType: "article",
    ogImage: input.publication.mainImageUrl,
    publishedTime: input.publication.publishedAt,
    modifiedTime: null,
    authors: input.publication.authorName
      ? [input.publication.authorName]
      : undefined,
  });
}

export function eventDetailMetadata(input: {
  locale: Locale;
  siteName: string;
  event: EventDetail;
  availableLocales: readonly Locale[];
}): Metadata {
  const description = buildMetaDescription({
    subtitle: input.event.subtitle,
    descriptionMarkdown: input.event.description,
    fallback: input.event.title,
  });
  return buildPageMetadata({
    locale: input.locale,
    pathname: `/events/${input.event.slug}`,
    title: titleWithSite(input.event.title, input.siteName),
    description,
    availableLocales: input.availableLocales,
    siteName: input.siteName,
    ogType: "article",
    ogImage: input.event.mainImageUrl,
    publishedTime: input.event.eventDate,
  });
}
