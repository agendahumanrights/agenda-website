import type { Locale } from "@/i18n/config";
import { absoluteLocalizedUrl } from "@/lib/seo/locale-url";
import {
  absoluteUrl,
  getSiteUrl,
  PRODUCTION_SITE_URL,
} from "@/lib/seo/site-url";
import { organizationLogoPath } from "@/lib/brand/logo";
import { ORGANIZATION_LOGO_PATH } from "@/lib/seo/metadata";

/** Social profiles already linked from the public footer. */
export const ORGANIZATION_SAME_AS = [
  "https://www.facebook.com/agenda4hr",
  "https://www.linkedin.com/company/agenda4hr",
  "https://www.youtube.com/@Agenda4hr",
] as const;

function organizationLogoUrl(locale?: Locale) {
  return absoluteUrl(
    locale ? organizationLogoPath(locale) : ORGANIZATION_LOGO_PATH,
  );
}

export function organizationJsonLd(siteName: string, locale?: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    alternateName: ["Agenda", "Human Rights Agenda", "مفكرة"],
    url: getSiteUrl() || PRODUCTION_SITE_URL,
    logo: organizationLogoUrl(locale),
    sameAs: [...ORGANIZATION_SAME_AS],
  };
}

export function websiteJsonLd(input: {
  siteName: string;
  description: string;
  locale: Locale;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: input.siteName,
    description: input.description,
    url: absoluteLocalizedUrl("/", input.locale),
    inLanguage: input.locale,
    publisher: {
      "@type": "Organization",
      name: input.siteName,
      logo: organizationLogoUrl(input.locale),
    },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; url?: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

export function articleJsonLd(input: {
  locale: Locale;
  siteName: string;
  headline: string;
  description: string;
  url: string;
  imageUrl?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string | null;
  /** Use BlogPosting for BLOG category slug; else Article. */
  type: "Article" | "BlogPosting";
}) {
  return {
    "@context": "https://schema.org",
    "@type": input.type,
    headline: input.headline,
    description: input.description,
    url: input.url,
    mainEntityOfPage: input.url,
    inLanguage: input.locale,
    ...(input.imageUrl ? { image: [absoluteUrl(input.imageUrl)] } : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    ...(input.authorName
      ? {
          author: {
            "@type": "Person",
            name: input.authorName,
          },
        }
      : {}),
    publisher: {
      "@type": "Organization",
      name: input.siteName,
      logo: {
        "@type": "ImageObject",
        url: organizationLogoUrl(input.locale),
      },
    },
  };
}

/**
 * Event markup only when we have a real name + start date.
 * Location/offers omitted — not present in the data model.
 */
export function eventJsonLd(input: {
  locale: Locale;
  siteName: string;
  name: string;
  description: string;
  url: string;
  eventDate: string;
  imageUrl?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: input.name,
    description: input.description,
    url: input.url,
    inLanguage: input.locale,
    // Only properties backed by real data (no invented location/offers/times).
    startDate: input.eventDate.slice(0, 10),
    ...(input.imageUrl ? { image: [absoluteUrl(input.imageUrl)] } : {}),
    organizer: {
      "@type": "Organization",
      name: input.siteName,
      url: getSiteUrl(),
    },
  };
}

/** Person markup for public writer profiles (only real fields). */
export function personJsonLd(input: {
  name: string;
  url: string;
  imageUrl?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  description?: string | null;
  sameAs?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    url: input.url,
    ...(input.imageUrl ? { image: absoluteUrl(input.imageUrl) } : {}),
    ...(input.jobTitle ? { jobTitle: input.jobTitle } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.sameAs && input.sameAs.length > 0
      ? { sameAs: input.sameAs }
      : {}),
  };
}

/** Safe JSON for embedding in <script type="application/ld+json">. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
