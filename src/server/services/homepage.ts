import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { revalidateEventPaths } from "@/server/cache/events";
import { revalidatePublicationPaths } from "@/server/cache/publications";
import { CACHE_TAGS } from "@/server/cache/tags";
import {
  getPrisma,
  isDatabaseConfigured,
  withDatabaseFallback,
  withInteractiveTransaction,
} from "@/server/db";

import { badRequest, conflict, serviceUnavailable } from "@/server/http/errors";
import {
  localizeCategoryName,
  mapCategorySummary,
} from "@/server/services/categories";
import { getStorage } from "@/server/storage";
import type { Locale } from "@/i18n/config";
import type { EventListItem } from "@/types/event";
import type { PublicationListItem } from "@/types/publication";
import type {
  FeaturedEventsInput,
  FeaturedPublicationsInput,
  HomepageSelectionInput,
  HomepageSelectionPatch,
} from "@/server/validations/homepage";

const MAX_FEATURED_EVENTS = 3;

/**
 * Homepage selection rules:
 * - Featured publications: any number, admin-ordered; must be PUBLISHED.
 * - Featured events: at most 3; must be PUBLISHED.
 * - Section saves preserve the other section.
 * - The same featured publication list drives the homepage slider and catalogue.
 */

function requireDb() {
  if (!isDatabaseConfigured()) {
    throw serviceUnavailable("Database is not configured.");
  }
}

function revalidateHomepage() {
  revalidatePublicationPaths();
  revalidateEventPaths();
}

export async function getFeaturedPublications(
  locale: Locale,
): Promise<PublicationListItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.homepage);
  cacheTag(CACHE_TAGS.publications);

  return withDatabaseFallback(async () => {
    const prisma = getPrisma();
    const rows = await prisma.featuredPublication.findMany({
      orderBy: { sortOrder: "asc" },
      where: {
        publication: {
          status: "PUBLISHED",
          translations: { some: { locale } },
        },
      },
      select: {
        publication: {
          select: {
            id: true,
            slug: true,
            publishedAt: true,
            category: {
              select: {
                id: true,
                slug: true,
                nameEn: true,
                nameAr: true,
                requiresAuthor: true,
              },
            },
            mainImage: { select: { storageKey: true } },
            authorFounder: {
              select: {
                bioKey: true,
                translations: {
                  where: { locale },
                  take: 1,
                  select: { fullName: true },
                },
              },
            },
            translations: {
              where: { locale },
              take: 1,
              select: { title: true, subtitle: true },
            },
          },
        },
      },
    });

    const storage = getStorage();
    return rows
      .filter((r) => r.publication.translations[0])
      .map((r) => {
        const p = r.publication;
        const t = p.translations[0]!;
        return {
          id: p.id,
          category: mapCategorySummary(p.category, locale),
          publishedAt: p.publishedAt?.toISOString() ?? null,
          title: t.title,
          subtitle: t.subtitle,
          slug: p.slug,
          mainImageUrl: p.mainImage
            ? storage.getPublicUrl(p.mainImage.storageKey)
            : null,
          authorName: p.authorFounder?.translations[0]?.fullName ?? null,
          authorBioKey: p.authorFounder?.bioKey ?? null,
        };
      });
  }, []);
}

export async function getFeaturedEvents(
  locale: Locale,
): Promise<EventListItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.homepage);
  cacheTag(CACHE_TAGS.events);

  return withDatabaseFallback(async () => {
    const prisma = getPrisma();
    const rows = await prisma.featuredEvent.findMany({
      orderBy: { sortOrder: "asc" },
      take: MAX_FEATURED_EVENTS,
      where: {
        event: {
          status: "PUBLISHED",
          translations: { some: { locale } },
        },
      },
      select: {
        event: {
          select: {
            id: true,
            slug: true,
            eventDate: true,
            createdAt: true,
            mainImage: { select: { storageKey: true } },
            translations: {
              where: { locale },
              take: 1,
              select: { title: true, subtitle: true },
            },
          },
        },
      },
    });

    const storage = getStorage();
    return rows
      .filter((r) => r.event.translations[0])
      .map((r) => {
        const e = r.event;
        const t = e.translations[0]!;
        return {
          id: e.id,
          eventDate: e.eventDate.toISOString(),
          createdAt: e.createdAt.toISOString(),
          title: t.title,
          subtitle: t.subtitle,
          slug: e.slug,
          mainImageUrl: e.mainImage
            ? storage.getPublicUrl(e.mainImage.storageKey)
            : null,
        };
      });
  }, []);
}

type SelectableOption = {
  id: string;
  slug: string;
  /** Display title for the current admin UI locale. */
  title: string;
  /** Both locale titles for bilingual search. */
  titleAr: string;
  titleEn: string;
  mainImageUrl: string | null;
  isFeatured: boolean;
  eventDate?: string;
  /** Publication category when the option is a publication. */
  category?: string;
  /** ISO publication date when the option is a publication. */
  publishedAt?: string | null;
};

function pickTitles(
  translations: { locale: string; title: string }[],
  locale: Locale,
  fallback: string,
) {
  const titleAr =
    translations.find((t) => t.locale === "ar")?.title?.trim() || "";
  const titleEn =
    translations.find((t) => t.locale === "en")?.title?.trim() || "";
  const title =
    translations.find((t) => t.locale === locale)?.title?.trim() ||
    titleAr ||
    titleEn ||
    fallback;
  return { title, titleAr: titleAr || title, titleEn: titleEn || title };
}

/** Admin: featured publications + eligible published options. */
export async function getAdminFeaturedPublicationsState(locale: Locale) {
  requireDb();
  const prisma = getPrisma();
  const storage = getStorage();

  const [featuredRows, published] = await Promise.all([
    prisma.featuredPublication.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        publication: {
          include: {
            category: true,
            translations: true,
            mainImage: true,
          },
        },
      },
    }),
    prisma.publication.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      include: {
        category: true,
        translations: true,
        mainImage: true,
        featured: true,
      },
    }),
  ]);

  const mapOption = (
    p: {
      id: string;
      slug: string;
      category: { nameEn: string; nameAr: string };
      publishedAt: Date | null;
      translations: { locale: string; title: string }[];
      mainImage: { storageKey: string } | null;
      featured?: { id: string } | null;
    },
    forceFeatured?: boolean,
  ): SelectableOption => {
    const titles = pickTitles(p.translations, locale, p.slug);
    return {
      id: p.id,
      slug: p.slug,
      ...titles,
      category: localizeCategoryName(p.category, locale),
      publishedAt: p.publishedAt?.toISOString() ?? null,
      mainImageUrl: p.mainImage
        ? storage.getPublicUrl(p.mainImage.storageKey)
        : null,
      isFeatured: forceFeatured ?? Boolean(p.featured),
    };
  };

  return {
    selected: featuredRows
      .filter((r) => r.publication.status === "PUBLISHED")
      .map((r) => mapOption(r.publication, true)),
    available: published.map((p) => mapOption(p)),
  };
}

/** Admin: featured events (max 3) + eligible published options. */
export async function getAdminFeaturedEventsState(locale: Locale) {
  requireDb();
  const prisma = getPrisma();
  const storage = getStorage();

  const [featuredRows, published] = await Promise.all([
    prisma.featuredEvent.findMany({
      orderBy: { sortOrder: "asc" },
      take: MAX_FEATURED_EVENTS,
      include: {
        event: {
          include: {
            translations: true,
            mainImage: true,
          },
        },
      },
    }),
    prisma.event.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
      include: {
        translations: true,
        mainImage: true,
        featured: true,
      },
    }),
  ]);

  const mapOption = (
    e: {
      id: string;
      slug: string;
      eventDate: Date;
      translations: { locale: string; title: string }[];
      mainImage: { storageKey: string } | null;
      featured?: { id: string } | null;
    },
    forceFeatured?: boolean,
  ): SelectableOption => {
    const titles = pickTitles(e.translations, locale, e.slug);
    return {
      id: e.id,
      slug: e.slug,
      ...titles,
      eventDate: e.eventDate.toISOString(),
      mainImageUrl: e.mainImage
        ? storage.getPublicUrl(e.mainImage.storageKey)
        : null,
      isFeatured: forceFeatured ?? Boolean(e.featured),
    };
  };

  return {
    selected: featuredRows
      .filter((r) => r.event.status === "PUBLISHED")
      .map((r) => mapOption(r.event, true)),
    available: published.map((e) => mapOption(e)),
    max: MAX_FEATURED_EVENTS,
  };
}

export async function getAdminHomepageSelectionState(locale: Locale) {
  const [publications, events] = await Promise.all([
    getAdminFeaturedPublicationsState(locale),
    getAdminFeaturedEventsState(locale),
  ]);
  return { publications, events };
}

/** Replace featured publications only — preserves FeaturedEvent rows. */
export async function setFeaturedPublications(
  input: FeaturedPublicationsInput,
): Promise<void> {
  requireDb();
  const ids = input.publicationIds;
  const prisma = getPrisma();

  await withInteractiveTransaction(async (tx) => {
    if (ids.length > 0) {
      const publications = await tx.publication.findMany({
        where: { id: { in: ids } },
        select: { id: true, status: true },
      });
      if (publications.length !== ids.length) {
        throw conflict(
          "One or more selected publications were deleted. Refresh the list, remove missing items, and try again.",
        );
      }
      if (publications.some((p) => p.status !== "PUBLISHED")) {
        throw conflict(
          "One or more selected publications are no longer published. Remove them from the selection or publish them again, then save.",
        );
      }
    }

    await tx.featuredPublication.deleteMany({});
    if (ids.length > 0) {
      await tx.featuredPublication.createMany({
        data: ids.map((publicationId, index) => ({
          publicationId,
          sortOrder: index,
        })),
      });
    }
  });

  revalidateHomepage();
}

/** Replace featured events only — preserves FeaturedPublication rows. Max 3. */
export async function setFeaturedEvents(
  input: FeaturedEventsInput,
): Promise<void> {
  requireDb();
  const ids = input.eventIds;
  if (ids.length > MAX_FEATURED_EVENTS) {
    throw badRequest(
      `At most ${MAX_FEATURED_EVENTS} events can be featured on the homepage.`,
    );
  }

  const prisma = getPrisma();

  await withInteractiveTransaction(async (tx) => {
    if (ids.length > 0) {
      const events = await tx.event.findMany({
        where: { id: { in: ids } },
        select: { id: true, status: true },
      });
      if (events.length !== ids.length) {
        throw conflict(
          "One or more selected events were deleted. Refresh the list, remove missing items, and try again.",
        );
      }
      if (events.some((e) => e.status !== "PUBLISHED")) {
        throw conflict(
          "One or more selected events are no longer published. Remove them from the selection or publish them again, then save.",
        );
      }
    }

    await tx.featuredEvent.deleteMany({});
    if (ids.length > 0) {
      await tx.featuredEvent.createMany({
        data: ids.map((eventId, index) => ({
          eventId,
          sortOrder: index,
        })),
      });
    }
  });

  revalidateHomepage();
}

/**
 * Patch homepage selection. Omitted sections are preserved.
 */
export async function patchHomepageSelection(
  input: HomepageSelectionPatch,
): Promise<void> {
  if (input.featuredPublications) {
    await setFeaturedPublications(input.featuredPublications);
  }
  if (input.featuredEvents) {
    await setFeaturedEvents(input.featuredEvents);
  }
}

/** Full replace of both sections (rarely used). */
export async function setHomepageSelection(
  input: HomepageSelectionInput,
): Promise<void> {
  await setFeaturedPublications(input.featuredPublications);
  await setFeaturedEvents(input.featuredEvents);
}

export { MAX_FEATURED_EVENTS };
