import type { MetadataRoute } from "next";

import type { Locale } from "@/i18n/config";
import { LOCALES } from "@/i18n/config";
import {
  absoluteLocalizedUrl,
  hreflangLanguages,
} from "@/lib/seo/locale-url";
import { isNonProductionIndexing } from "@/lib/seo/site-url";
import {
  listPublishedEventsForSitemap,
  listPublishedPublicationsForSitemap,
} from "@/server/services/seo-sitemap";

const STATIC_PATHS: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/publications", priority: 0.9, changeFrequency: "daily" },
  { path: "/events", priority: 0.9, changeFrequency: "daily" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
];

function entriesForPath(
  path: string,
  locales: readonly Locale[],
  extras: {
    lastModified?: Date;
    changeFrequency?: MetadataRoute.Sitemap[0]["changeFrequency"];
    priority?: number;
  } = {},
): MetadataRoute.Sitemap {
  const languages = hreflangLanguages(path, locales);
  return locales.map((locale) => ({
    url: absoluteLocalizedUrl(path, locale),
    lastModified: extras.lastModified,
    changeFrequency: extras.changeFrequency,
    priority: extras.priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Still emit URLs on non-prod so staging can be validated; robots will noindex.
  void isNonProductionIndexing;

  const entries: MetadataRoute.Sitemap = [];

  for (const item of STATIC_PATHS) {
    entries.push(
      ...entriesForPath(item.path, LOCALES, {
        changeFrequency: item.changeFrequency,
        priority: item.priority,
        lastModified: new Date(),
      }),
    );
  }

  try {
    const [publications, events] = await Promise.all([
      listPublishedPublicationsForSitemap(),
      listPublishedEventsForSitemap(),
    ]);

    for (const pub of publications) {
      entries.push(
        ...entriesForPath(`/publications/${pub.slug}`, pub.locales, {
          lastModified: pub.updatedAt,
          changeFrequency: "weekly",
          priority: 0.8,
        }),
      );
    }

    for (const event of events) {
      entries.push(
        ...entriesForPath(`/events/${event.slug}`, event.locales, {
          lastModified: event.updatedAt,
          changeFrequency: "weekly",
          priority: 0.7,
        }),
      );
    }
  } catch {
    // DB unavailable — static routes only.
  }

  return entries;
}
