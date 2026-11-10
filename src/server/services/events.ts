import "server-only";

import { Prisma } from "@/generated/prisma";

import { endOfUtcDay, parseUtcDateOnly, startOfUtcDay } from "@/lib/dates";
import { slugify } from "@/lib/slugs";
import { revalidateEventPaths } from "@/server/cache/events";
import { getPrisma, isDatabaseConfigured } from "@/server/db";
import {
  badRequest,
  conflict,
  notFound,
  serviceUnavailable,
} from "@/server/http/errors";
import { buildDetailImages } from "@/server/services/detail-images";
import {
  assertMediaReady,
  deleteMediaAssetIfOrphaned,
  mapMediaRef,
} from "@/server/services/media";
import { getStorage } from "@/server/storage";
import {
  assertContentImageCountAllowed,
  countContentImages,
} from "@/server/storage/content-image-limits";
import type {
  AdminEventListQuery,
  CreateEventBody,
  PublicEventListQuery,
  UpdateEventBody,
} from "@/server/validations/events";
import type { PaginatedResult } from "@/types/api";
import type {
  AdminEventDetail,
  AdminEventListItem,
  EventDetail,
  EventListItem,
} from "@/types/event";

/**
 * Business rules:
 * - Public queries only return PUBLISHED events.
 * - Public/admin creation-date filters use createdAt, never eventDate.
 * - eventDate is the visitor-facing occurrence date (UTC calendar date).
 * - Drafts need at least one title; publishing requires both locales + main image + eventDate.
 * - Slug is immutable after creation; createdAt is never editable.
 * - Unpublish/delete removes FeaturedEvent in the same transaction.
 * - Max 3 featured events (homepage service).
 */

function requireDb() {
  if (!isDatabaseConfigured()) {
    throw serviceUnavailable("Database is not configured.");
  }
}

function mapListItem(row: {
  id: string;
  slug: string;
  eventDate: Date;
  createdAt: Date;
  mainImage: { storageKey: string } | null;
  translations: { title: string; subtitle: string }[];
}): EventListItem {
  const t = row.translations[0];
  const storage = getStorage();
  return {
    id: row.id,
    eventDate: row.eventDate.toISOString(),
    createdAt: row.createdAt.toISOString(),
    title: t?.title ?? "",
    subtitle: t?.subtitle ?? "",
    slug: row.slug,
    mainImageUrl: row.mainImage
      ? storage.getPublicUrl(row.mainImage.storageKey)
      : null,
  };
}

function pickTitle(
  translations: { locale: string; title: string }[],
  preferred: "ar" | "en",
): string {
  const preferredRow = translations.find((t) => t.locale === preferred);
  if (preferredRow?.title.trim()) return preferredRow.title;
  const other = translations.find((t) => t.title.trim());
  return other?.title ?? "";
}

function createdAtFilter(from?: Date, to?: Date) {
  if (!from && !to) return undefined;
  return {
    ...(from ? { gte: startOfUtcDay(from) } : {}),
    ...(to ? { lte: endOfUtcDay(to) } : {}),
  };
}

export async function listPublishedEvents(
  query: PublicEventListQuery,
): Promise<PaginatedResult<EventListItem>> {
  const empty: PaginatedResult<EventListItem> = {
    items: [],
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total: 0,
      totalPages: 0,
    },
  };

  if (!isDatabaseConfigured()) {
    return empty;
  }

  const prisma = getPrisma();
  const createdAt = createdAtFilter(query.createdFrom, query.createdTo);
  const where = {
    status: "PUBLISHED" as const,
    ...(createdAt ? { createdAt } : {}),
    translations: {
      some: {
        locale: query.locale,
        ...(query.q
          ? { title: { contains: query.q, mode: "insensitive" as const } }
          : {}),
      },
    },
  };

  const dateDir = query.sort === "oldest" ? "asc" : "desc";
  const [total, rows] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      orderBy: [{ eventDate: dateDir }, { id: dateDir }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        mainImage: true,
        translations: { where: { locale: query.locale }, take: 1 },
      },
    }),
  ]);

  return {
    items: rows.map(mapListItem),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.pageSize),
    },
  };
}

export async function getPublishedEventBySlug(
  locale: "ar" | "en",
  slug: string,
): Promise<EventDetail> {
  if (!isDatabaseConfigured()) {
    throw notFound("Event not found");
  }

  const prisma = getPrisma();
  const row = await prisma.event.findFirst({
    where: {
      status: "PUBLISHED",
      slug,
    },
    include: {
      mainImage: { include: { altTexts: true } },
      gallery: {
        orderBy: { sortOrder: "asc" },
        include: { mediaAsset: { include: { altTexts: true } } },
      },
      translations: { where: { locale }, take: 1 },
    },
  });

  if (!row || !row.translations[0]) {
    throw notFound("Event not found");
  }

  const base = mapListItem(row);
  const images = buildDetailImages({
    mainImage: row.mainImage,
    gallery: row.gallery.map((g) => g.mediaAsset),
    locale,
    fallbackAlt: row.translations[0].title,
  });

  return {
    ...base,
    description: row.translations[0].description,
    youtubeUrl: row.youtubeUrl ?? null,
    galleryImageUrls: images
      .filter((img) => img.id !== row.mainImage?.id)
      .map((img) => img.url),
    images,
  };
}

function assertDraftHasTitle(translations: { title: string }[]): void {
  if (!translations.some((t) => t.title.trim().length > 0)) {
    throw badRequest("At least one language title is required for a draft.");
  }
}

function assertPublishable(input: {
  eventDate: Date | null | undefined;
  mainImageId: string | null | undefined;
  translations: {
    locale: string;
    title: string;
    subtitle: string;
    description: string;
  }[];
}): void {
  const byLocale = new Map(input.translations.map((t) => [t.locale, t]));
  for (const locale of ["ar", "en"] as const) {
    const t = byLocale.get(locale);
    if (!t || !t.title.trim() || !t.subtitle.trim() || !t.description.trim()) {
      throw badRequest(
        `Publishing requires complete ${locale.toUpperCase()} title, subtitle, and description.`,
      );
    }
  }
  if (!input.mainImageId) {
    throw badRequest("Publishing requires a main image.");
  }
  if (!input.eventDate) {
    throw badRequest("Publishing requires an event date.");
  }
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const prisma = getPrisma();
  let candidate = base || `event-${Date.now().toString(36)}`;
  candidate = candidate.slice(0, 160);
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? candidate : `${candidate.slice(0, 140)}-${i + 1}`;
    const existing = await prisma.event.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return slug;
  }
  throw conflict("Could not allocate a unique slug. Choose a different slug.");
}

async function validateMediaRefs(input: {
  mainImageId?: string | null;
  galleryImageIds?: string[];
  previousImageCount?: number;
}): Promise<void> {
  if (input.mainImageId) {
    await assertMediaReady({ id: input.mainImageId, expectedKind: "IMAGE" });
  }
  const gallery = input.galleryImageIds ?? [];
  assertContentImageCountAllowed({
    mainImageId: input.mainImageId,
    galleryImageIds: gallery,
    previousCount: input.previousImageCount,
  });
  const unique = new Set(gallery);
  if (unique.size !== gallery.length) {
    throw badRequest("Duplicate gallery image IDs are not allowed.");
  }
  for (const id of gallery) {
    await assertMediaReady({ id, expectedKind: "IMAGE" });
  }
}

const adminInclude = {
  mainImage: { include: { altTexts: true } },
  gallery: {
    orderBy: { sortOrder: "asc" as const },
    include: { mediaAsset: { include: { altTexts: true } } },
  },
  translations: true,
  featured: true,
} satisfies Prisma.EventInclude;

function mapAdminDetail(
  row: Prisma.EventGetPayload<{ include: typeof adminInclude }>,
): AdminEventDetail {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    eventDate: row.eventDate.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    translations: row.translations.map((t) => ({
      locale: t.locale,
      title: t.title,
      subtitle: t.subtitle,
      description: t.description,
    })),
    mainImage: row.mainImage ? mapMediaRef(row.mainImage) : null,
    youtubeUrl: row.youtubeUrl ?? null,
    gallery: row.gallery.map((g) =>
      mapMediaRef({ ...g.mediaAsset, sortOrder: g.sortOrder }),
    ),
    isFeatured: Boolean(row.featured),
    featuredSortOrder: row.featured?.sortOrder ?? null,
  };
}

export async function listAdminEvents(
  query: AdminEventListQuery,
): Promise<PaginatedResult<AdminEventListItem>> {
  requireDb();
  const prisma = getPrisma();
  const createdAt = createdAtFilter(query.createdFrom, query.createdTo);

  const where: Prisma.EventWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(query.q
      ? {
          translations: {
            some: {
              title: { contains: query.q, mode: "insensitive" },
            },
          },
        }
      : {}),
  };

  const orderBy: Prisma.EventOrderByWithRelationInput[] =
    query.sort === "createdAt_asc"
      ? [{ createdAt: "asc" }]
      : query.sort === "eventDate_desc"
        ? [{ eventDate: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }];

  const [total, rows] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        mainImage: true,
        translations: true,
        featured: true,
      },
    }),
  ]);

  const storage = getStorage();
  const items: AdminEventListItem[] = rows.map((row) => {
    const titleAr = row.translations.find((t) => t.locale === "ar")?.title ?? null;
    const titleEn = row.translations.find((t) => t.locale === "en")?.title ?? null;
    return {
      id: row.id,
      slug: row.slug,
      status: row.status,
      eventDate: row.eventDate.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      title: pickTitle(row.translations, query.locale),
      titleAr,
      titleEn,
      mainImageUrl: row.mainImage
        ? storage.getPublicUrl(row.mainImage.storageKey)
        : null,
      isFeatured: Boolean(row.featured),
    };
  });

  return {
    items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.pageSize),
    },
  };
}

export async function getAdminEventById(id: string): Promise<AdminEventDetail> {
  requireDb();
  const prisma = getPrisma();
  const row = await prisma.event.findUnique({
    where: { id },
    include: adminInclude,
  });
  if (!row) throw notFound("Event not found");
  return mapAdminDetail(row);
}

export async function createEvent(
  input: CreateEventBody,
): Promise<AdminEventDetail> {
  requireDb();
  assertDraftHasTitle(input.translations);

  const eventDate = parseUtcDateOnly(input.eventDate);

  if (input.status === "PUBLISHED") {
    assertPublishable({
      eventDate,
      mainImageId: input.mainImageId,
      translations: input.translations,
    });
  }

  await validateMediaRefs({
    mainImageId: input.mainImageId,
    galleryImageIds: input.galleryImageIds,
  });

  const titleForSlug =
    input.translations.find((t) => t.locale === "en")?.title ||
    input.translations.find((t) => t.title.trim())?.title ||
    "";
  const baseSlug = input.slug?.trim() || slugify(titleForSlug) || "event";
  const slug = await ensureUniqueSlug(baseSlug);

  const prisma = getPrisma();
  const galleryIds = input.galleryImageIds ?? [];

  try {
    const created = await prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          slug,
          status: input.status,
          eventDate,
          mainImageId: input.mainImageId ?? null,
          youtubeUrl: input.youtubeUrl ?? null,
          translations: {
            create: input.translations.map((t) => ({
              locale: t.locale,
              title: t.title.trim(),
              subtitle: t.subtitle.trim(),
              description: t.description,
            })),
          },
          gallery: {
            create: galleryIds.map((mediaAssetId, index) => ({
              mediaAssetId,
              sortOrder: index,
            })),
          },
        },
        include: adminInclude,
      });

      if (input.featureOnHomepage) {
        if (event.status !== "PUBLISHED") {
          throw badRequest("Only published events can be featured.");
        }
        const count = await tx.featuredEvent.count();
        if (count >= 3) {
          throw badRequest("At most 3 events can be featured on the homepage.");
        }
        await tx.featuredEvent.create({
          data: {
            eventId: event.id,
            sortOrder: count,
          },
        });
      }

      return tx.event.findUniqueOrThrow({
        where: { id: event.id },
        include: adminInclude,
      });
    });

    revalidateEventPaths(created.slug);
    return mapAdminDetail(created);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict("An event with this slug already exists.");
    }
    throw error;
  }
}

export async function updateEvent(
  id: string,
  input: UpdateEventBody,
): Promise<AdminEventDetail> {
  requireDb();
  const prisma = getPrisma();
  const existing = await prisma.event.findUnique({
    where: { id },
    include: {
      gallery: true,
      featured: true,
      translations: true,
    },
  });
  if (!existing) throw notFound("Event not found");

  const nextStatus = input.status ?? existing.status;
  const nextEventDate =
    input.eventDate !== undefined
      ? parseUtcDateOnly(input.eventDate)
      : existing.eventDate;
  const nextMainImage =
    input.mainImageId !== undefined ? input.mainImageId : existing.mainImageId;
  const nextYoutubeUrl =
    input.youtubeUrl !== undefined ? input.youtubeUrl : existing.youtubeUrl;
  const nextGallery =
    input.galleryImageIds !== undefined
      ? input.galleryImageIds
      : existing.gallery
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((g) => g.mediaAssetId);
  const nextTranslations =
    input.translations ??
    existing.translations.map((t) => ({
      locale: t.locale,
      title: t.title,
      subtitle: t.subtitle,
      description: t.description,
    }));

  assertDraftHasTitle(nextTranslations);

  if (nextStatus === "PUBLISHED") {
    assertPublishable({
      eventDate: nextEventDate,
      mainImageId: nextMainImage,
      translations: nextTranslations,
    });
  }

  const previousImageCount = countContentImages(
    Boolean(existing.mainImageId),
    existing.gallery.length,
  );
  await validateMediaRefs({
    mainImageId: nextMainImage,
    galleryImageIds: nextGallery,
    previousImageCount,
  });

  const previousMediaIds = [
    existing.mainImageId,
    ...existing.gallery.map((g) => g.mediaAssetId),
  ].filter(Boolean) as string[];

  const updated = await prisma.$transaction(async (tx) => {
    if (input.translations) {
      for (const t of input.translations) {
        await tx.eventTranslation.upsert({
          where: {
            eventId_locale: { eventId: id, locale: t.locale },
          },
          create: {
            eventId: id,
            locale: t.locale,
            title: t.title.trim(),
            subtitle: t.subtitle.trim(),
            description: t.description,
          },
          update: {
            title: t.title.trim(),
            subtitle: t.subtitle.trim(),
            description: t.description,
          },
        });
      }
    }

    if (input.galleryImageIds) {
      await tx.eventGalleryImage.deleteMany({ where: { eventId: id } });
      if (input.galleryImageIds.length > 0) {
        await tx.eventGalleryImage.createMany({
          data: input.galleryImageIds.map((mediaAssetId, index) => ({
            eventId: id,
            mediaAssetId,
            sortOrder: index,
          })),
        });
      }
    }

    const unpublishing =
      existing.status === "PUBLISHED" && nextStatus === "DRAFT";
    if (unpublishing || (input.featureOnHomepage === false && existing.featured)) {
      await tx.featuredEvent.deleteMany({ where: { eventId: id } });
    }

    await tx.event.update({
      where: { id },
      data: {
        status: nextStatus,
        eventDate: nextEventDate,
        mainImageId: nextMainImage,
        youtubeUrl: nextYoutubeUrl,
      },
    });

    if (input.featureOnHomepage === true) {
      const current = await tx.event.findUniqueOrThrow({
        where: { id },
        select: { status: true },
      });
      if (current.status !== "PUBLISHED") {
        throw badRequest("Only published events can be featured.");
      }
      const existingFeatured = await tx.featuredEvent.findUnique({
        where: { eventId: id },
      });
      if (!existingFeatured) {
        const count = await tx.featuredEvent.count();
        if (count >= 3) {
          throw badRequest("At most 3 events can be featured on the homepage.");
        }
        await tx.featuredEvent.create({
          data: { eventId: id, sortOrder: count },
        });
      }
    }

    return tx.event.findUniqueOrThrow({
      where: { id },
      include: adminInclude,
    });
  });

  const nextMediaIds = [
    updated.mainImageId,
    ...updated.gallery.map((g) => g.mediaAssetId),
  ].filter(Boolean) as string[];
  const removed = previousMediaIds.filter((mid) => !nextMediaIds.includes(mid));
  for (const mediaId of removed) {
    await deleteMediaAssetIfOrphaned(mediaId);
  }

  revalidateEventPaths(updated.slug);
  return mapAdminDetail(updated);
}

export async function deleteEvent(id: string): Promise<void> {
  requireDb();
  const prisma = getPrisma();
  const existing = await prisma.event.findUnique({
    where: { id },
    include: { gallery: true },
  });
  if (!existing) throw notFound("Event not found");

  const mediaIds = [
    existing.mainImageId,
    ...existing.gallery.map((g) => g.mediaAssetId),
  ].filter(Boolean) as string[];

  await prisma.$transaction(async (tx) => {
    await tx.featuredEvent.deleteMany({ where: { eventId: id } });
    await tx.event.delete({ where: { id } });
  });

  for (const mediaId of mediaIds) {
    await deleteMediaAssetIfOrphaned(mediaId);
  }

  revalidateEventPaths(existing.slug);
}
