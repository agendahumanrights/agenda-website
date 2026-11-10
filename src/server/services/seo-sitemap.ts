import "server-only";

import type { Locale } from "@/i18n/config";
import { getPrisma, isDatabaseConfigured } from "@/server/db";

export type SitemapContentEntry = {
  slug: string;
  updatedAt: Date;
  locales: Locale[];
};

function localesFromTranslations(
  translations: { locale: string; title: string }[],
): Locale[] {
  const out: Locale[] = [];
  for (const row of translations) {
    if (
      (row.locale === "ar" || row.locale === "en") &&
      row.title.trim().length > 0
    ) {
      out.push(row.locale);
    }
  }
  return out;
}

/** Published publications with locales that have a non-empty title. */
export async function listPublishedPublicationsForSitemap(): Promise<
  SitemapContentEntry[]
> {
  if (!isDatabaseConfigured()) return [];
  const prisma = getPrisma();
  const rows = await prisma.publication.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true,
      updatedAt: true,
      translations: { select: { locale: true, title: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return rows
    .map((row) => ({
      slug: row.slug,
      updatedAt: row.updatedAt,
      locales: localesFromTranslations(row.translations),
    }))
    .filter((row) => row.locales.length > 0);
}

/** Published events with locales that have a non-empty title. */
export async function listPublishedEventsForSitemap(): Promise<
  SitemapContentEntry[]
> {
  if (!isDatabaseConfigured()) return [];
  const prisma = getPrisma();
  const rows = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true,
      updatedAt: true,
      translations: { select: { locale: true, title: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return rows
    .map((row) => ({
      slug: row.slug,
      updatedAt: row.updatedAt,
      locales: localesFromTranslations(row.translations),
    }))
    .filter((row) => row.locales.length > 0);
}

/** Locales that have a published translation for a given publication slug. */
export async function getPublicationLocalesForSlug(
  slug: string,
): Promise<Locale[]> {
  if (!isDatabaseConfigured()) return [];
  const prisma = getPrisma();
  const row = await prisma.publication.findFirst({
    where: { status: "PUBLISHED", slug },
    select: { translations: { select: { locale: true, title: true } } },
  });
  return row ? localesFromTranslations(row.translations) : [];
}

export async function getEventLocalesForSlug(slug: string): Promise<Locale[]> {
  if (!isDatabaseConfigured()) return [];
  const prisma = getPrisma();
  const row = await prisma.event.findFirst({
    where: { status: "PUBLISHED", slug },
    select: { translations: { select: { locale: true, title: true } } },
  });
  return row ? localesFromTranslations(row.translations) : [];
}
