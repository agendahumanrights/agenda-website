import "server-only";

import { Prisma } from "@/generated/prisma";

import { slugify } from "@/lib/slugs";
import { getPrisma, isDatabaseConfigured } from "@/server/db";
import {
  badRequest,
  conflict,
  notFound,
  serviceUnavailable,
} from "@/server/http/errors";
import { revalidatePublicationPaths } from "@/server/cache/publications";
import {
  assertCategoryExists,
  mapCategorySummary,
} from "@/server/services/categories";
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
  AdminPublicationListQuery,
  CreatePublicationBody,
  PublicPublicationListQuery,
  UpdatePublicationBody,
} from "@/server/validations/publications";
import type { PaginatedResult } from "@/types/api";
import type {
  AdminPublicationDetail,
  AdminPublicationListItem,
  PublicationDetail,
  PublicationListItem,
} from "@/types/publication";

/**
 * Business rules (service-enforced unless noted):
 * - Public queries only return PUBLISHED items.
 * - Categories with requiresAuthor need authorFounderId; others must not have one.
 * - Publishing requires both ar + en titles/subtitles/descriptions, main image, category, publishedAt.
 * - Drafts need at least one non-empty title.
 * - Slug is immutable after creation.
 * - Unpublish/delete removes FeaturedPublication in the same transaction.
 * - Featured selections must reference PUBLISHED publications (homepage service).
 */

function requireDb() {
  if (!isDatabaseConfigured()) {
    throw serviceUnavailable("Database is not configured.");
  }
}

function mapListItem(
  row: {
    id: string;
    slug: string;
    publishedAt: Date | null;
    category: {
      id: string;
      slug: string;
      nameEn: string;
      nameAr: string;
      requiresAuthor: boolean;
    };
    mainImage: { storageKey: string } | null;
    authorFounder: {
      bioKey: string;
      translations: { fullName: string }[];
    } | null;
    translations: {
      title: string;
      subtitle: string;
    }[];
  },
  locale: "ar" | "en",
): PublicationListItem {
  const t = row.translations[0];
  const storage = getStorage();
  return {
    id: row.id,
    category: mapCategorySummary(row.category, locale),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    title: t?.title ?? "",
    subtitle: t?.subtitle ?? "",
    slug: row.slug,
    mainImageUrl: row.mainImage
      ? storage.getPublicUrl(row.mainImage.storageKey)
      : null,
    authorName: row.authorFounder?.translations[0]?.fullName ?? null,
    authorBioKey: row.authorFounder?.bioKey ?? null,
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

export async function listPublishedPublications(
  query: PublicPublicationListQuery,
): Promise<PaginatedResult<PublicationListItem>> {
  const empty: PaginatedResult<PublicationListItem> = {
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
  const where: Prisma.PublicationWhereInput = {
    status: "PUBLISHED",
    ...(query.category ? { category: { slug: query.category } } : {}),
    translations: {
      some: {
        locale: query.locale,
        ...(query.q
          ? { title: { contains: query.q, mode: "insensitive" } }
          : {}),
      },
    },
  };

  const dateDir = query.sort === "oldest" ? "asc" : "desc";
  const [total, rows] = await Promise.all([
    prisma.publication.count({ where }),
    prisma.publication.findMany({
      where,
      orderBy: [
        { publishedAt: { sort: dateDir, nulls: "last" } },
        { id: dateDir },
      ],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        category: true,
        mainImage: true,
        authorFounder: {
          include: {
            translations: { where: { locale: query.locale }, take: 1 },
          },
        },
        translations: { where: { locale: query.locale }, take: 1 },
      },
    }),
  ]);

  return {
    items: rows.map((row) => mapListItem(row, query.locale)),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.pageSize),
    },
  };
}

export async function getPublishedPublicationBySlug(
  locale: "ar" | "en",
  slug: string,
): Promise<PublicationDetail> {
  if (!isDatabaseConfigured()) {
    throw notFound("Publication not found");
  }

  const prisma = getPrisma();
  const row = await prisma.publication.findFirst({
    where: {
      status: "PUBLISHED",
      slug,
    },
    include: {
      category: true,
      mainImage: { include: { altTexts: true } },
      pdf: true,
      gallery: {
        orderBy: { sortOrder: "asc" },
        include: { mediaAsset: { include: { altTexts: true } } },
      },
      authorFounder: {
        include: {
          profileImage: true,
          translations: { where: { locale }, take: 1 },
        },
      },
      translations: { where: { locale }, take: 1 },
    },
  });

  if (!row || !row.translations[0]) {
    throw notFound("Publication not found");
  }

  const storage = getStorage();
  const base = mapListItem(row, locale);
  const images = buildDetailImages({
    mainImage: row.mainImage,
    gallery: row.gallery.map((g) => g.mediaAsset),
    locale,
    fallbackAlt: row.translations[0].title,
  });

  return {
    ...base,
    description: row.translations[0].description,
    pdfUrl: row.pdf ? storage.getPublicUrl(row.pdf.storageKey) : null,
    youtubeUrl: row.youtubeUrl ?? null,
    galleryImageUrls: images
      .filter((img) => img.id !== row.mainImage?.id)
      .map((img) => img.url),
    images,
    authorProfessionalArea:
      row.authorFounder?.translations[0]?.professionalArea ?? null,
    authorImageUrl: row.authorFounder?.profileImage
      ? storage.getPublicUrl(row.authorFounder.profileImage.storageKey)
      : null,
  };
}

function assertDraftHasTitle(
  translations: { title: string }[],
): void {
  if (!translations.some((t) => t.title.trim().length > 0)) {
    throw badRequest("At least one language title is required for a draft.");
  }
}

function assertPublishable(input: {
  categoryId: string | null | undefined;
  requiresAuthor: boolean;
  publishedAt: Date | null | undefined;
  mainImageId: string | null | undefined;
  authorFounderId: string | null | undefined;
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
  if (!input.publishedAt) {
    throw badRequest("Publishing requires a publication date.");
  }
  if (!input.categoryId) {
    throw badRequest("Publishing requires a category.");
  }
  assertAuthorRules(input.requiresAuthor, input.authorFounderId ?? null);
}

function assertAuthorRules(
  requiresAuthor: boolean,
  authorFounderId: string | null,
): void {
  if (requiresAuthor) {
    if (!authorFounderId) {
      throw badRequest("This category requires a founder author.");
    }
  } else if (authorFounderId) {
    throw badRequest("Only author-required categories may have a founder author.");
  }
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const prisma = getPrisma();
  let candidate = base || `publication-${Date.now().toString(36)}`;
  candidate = candidate.slice(0, 160);
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? candidate : `${candidate.slice(0, 140)}-${i + 1}`;
    const existing = await prisma.publication.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return slug;
  }
  throw conflict("Could not allocate a unique slug. Choose a different slug.");
}

async function validateMediaRefs(input: {
  mainImageId?: string | null;
  pdfId?: string | null;
  galleryImageIds?: string[];
  previousImageCount?: number;
}): Promise<void> {
  if (input.mainImageId) {
    await assertMediaReady({ id: input.mainImageId, expectedKind: "IMAGE" });
  }
  if (input.pdfId) {
    await assertMediaReady({ id: input.pdfId, expectedKind: "PDF" });
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

async function assertFounderExists(id: string): Promise<void> {
  const prisma = getPrisma();
  const founder = await prisma.founder.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!founder) throw badRequest("Selected founder author does not exist.");
}

const adminInclude = {
  category: true,
  mainImage: { include: { altTexts: true } },
  pdf: { include: { altTexts: true } },
  gallery: {
    orderBy: { sortOrder: "asc" as const },
    include: { mediaAsset: { include: { altTexts: true } } },
  },
  authorFounder: {
    include: {
      translations: true,
    },
  },
  translations: true,
  featured: true,
} satisfies Prisma.PublicationInclude;

function mapAdminDetail(
  row: Prisma.PublicationGetPayload<{ include: typeof adminInclude }>,
  locale: "ar" | "en" = "ar",
): AdminPublicationDetail {
  const authorLocale =
    row.authorFounder?.translations.find((t) => t.locale === "ar") ??
    row.authorFounder?.translations[0];
  return {
    id: row.id,
    slug: row.slug,
    categoryId: row.categoryId,
    category: mapCategorySummary(row.category, locale),
    status: row.status,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    authorFounderId: row.authorFounderId,
    authorName: authorLocale?.fullName ?? null,
    authorBioKey: row.authorFounder?.bioKey ?? null,
    translations: row.translations.map((t) => ({
      locale: t.locale,
      title: t.title,
      subtitle: t.subtitle,
      description: t.description,
    })),
    mainImage: row.mainImage ? mapMediaRef(row.mainImage) : null,
    pdf: row.pdf ? mapMediaRef(row.pdf) : null,
    youtubeUrl: row.youtubeUrl ?? null,
    gallery: row.gallery.map((g) =>
      mapMediaRef({ ...g.mediaAsset, sortOrder: g.sortOrder }),
    ),
    isFeatured: Boolean(row.featured),
    featuredSortOrder: row.featured?.sortOrder ?? null,
  };
}

export async function listAdminPublications(
  query: AdminPublicationListQuery,
): Promise<PaginatedResult<AdminPublicationListItem>> {
  requireDb();
  const prisma = getPrisma();

  const where: Prisma.PublicationWhereInput = {
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(query.status ? { status: query.status } : {}),
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

  const orderBy: Prisma.PublicationOrderByWithRelationInput[] =
    query.sort === "createdAt_asc"
      ? [{ createdAt: "asc" }]
      : query.sort === "publishedAt_desc"
        ? [{ publishedAt: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }];

  const [total, rows] = await Promise.all([
    prisma.publication.count({ where }),
    prisma.publication.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        category: true,
        mainImage: true,
        translations: true,
        featured: true,
      },
    }),
  ]);

  const storage = getStorage();
  const items: AdminPublicationListItem[] = rows.map((row) => {
    const titleAr = row.translations.find((t) => t.locale === "ar")?.title ?? null;
    const titleEn = row.translations.find((t) => t.locale === "en")?.title ?? null;
    return {
      id: row.id,
      slug: row.slug,
      category: mapCategorySummary(row.category, query.locale),
      status: row.status,
      publishedAt: row.publishedAt?.toISOString() ?? null,
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

export async function getAdminPublicationById(
  id: string,
): Promise<AdminPublicationDetail> {
  requireDb();
  const prisma = getPrisma();
  const row = await prisma.publication.findUnique({
    where: { id },
    include: adminInclude,
  });
  if (!row) throw notFound("Publication not found");
  return mapAdminDetail(row);
}

export async function createPublication(
  input: CreatePublicationBody,
): Promise<AdminPublicationDetail> {
  requireDb();
  assertDraftHasTitle(input.translations);
  const category = await assertCategoryExists(input.categoryId);
  assertAuthorRules(category.requiresAuthor, input.authorFounderId ?? null);

  if (input.status === "PUBLISHED") {
    assertPublishable({
      categoryId: input.categoryId,
      requiresAuthor: category.requiresAuthor,
      publishedAt: input.publishedAt,
      mainImageId: input.mainImageId,
      authorFounderId: input.authorFounderId,
      translations: input.translations,
    });
  }

  if (input.authorFounderId) {
    await assertFounderExists(input.authorFounderId);
  }
  await validateMediaRefs({
    mainImageId: input.mainImageId,
    pdfId: input.pdfId,
    galleryImageIds: input.galleryImageIds,
  });

  const titleForSlug =
    input.translations.find((t) => t.locale === "en")?.title ||
    input.translations.find((t) => t.title.trim())?.title ||
    "";
  const baseSlug = input.slug?.trim() || slugify(titleForSlug) || "publication";
  const slug = await ensureUniqueSlug(baseSlug);

  const prisma = getPrisma();
  const galleryIds = input.galleryImageIds ?? [];

  try {
    const created = await prisma.$transaction(async (tx) => {
      const publication = await tx.publication.create({
        data: {
          slug,
          categoryId: input.categoryId,
          status: input.status,
          publishedAt: input.publishedAt ?? null,
          authorFounderId: category.requiresAuthor
            ? (input.authorFounderId ?? null)
            : null,
          mainImageId: input.mainImageId ?? null,
          pdfId: input.pdfId ?? null,
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
        if (publication.status !== "PUBLISHED") {
          throw badRequest("Only published publications can be featured.");
        }
        const maxOrder = await tx.featuredPublication.aggregate({
          _max: { sortOrder: true },
        });
        await tx.featuredPublication.create({
          data: {
            publicationId: publication.id,
            sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
          },
        });
      }

      return tx.publication.findUniqueOrThrow({
        where: { id: publication.id },
        include: adminInclude,
      });
    });

    revalidatePublicationPaths(created.slug);
    return mapAdminDetail(created);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict("A publication with this slug already exists.");
    }
    throw error;
  }
}

export async function updatePublication(
  id: string,
  input: UpdatePublicationBody,
): Promise<AdminPublicationDetail> {
  requireDb();
  const prisma = getPrisma();
  const existing = await prisma.publication.findUnique({
    where: { id },
    include: {
      category: true,
      gallery: true,
      featured: true,
      translations: true,
    },
  });
  if (!existing) throw notFound("Publication not found");

  const nextCategoryId = input.categoryId ?? existing.categoryId;
  const nextCategory =
    input.categoryId && input.categoryId !== existing.categoryId
      ? await assertCategoryExists(input.categoryId)
      : {
          id: existing.category.id,
          slug: existing.category.slug,
          requiresAuthor: existing.category.requiresAuthor,
        };
  const nextStatus = input.status ?? existing.status;
  const nextPublishedAt =
    input.publishedAt !== undefined ? input.publishedAt : existing.publishedAt;
  const nextAuthor =
    input.authorFounderId !== undefined
      ? input.authorFounderId
      : existing.authorFounderId;
  const nextMainImage =
    input.mainImageId !== undefined ? input.mainImageId : existing.mainImageId;
  const nextPdf = input.pdfId !== undefined ? input.pdfId : existing.pdfId;
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
  assertAuthorRules(nextCategory.requiresAuthor, nextAuthor);

  if (nextStatus === "PUBLISHED") {
    assertPublishable({
      categoryId: nextCategoryId,
      requiresAuthor: nextCategory.requiresAuthor,
      publishedAt: nextPublishedAt,
      mainImageId: nextMainImage,
      authorFounderId: nextAuthor,
      translations: nextTranslations,
    });
  }

  if (nextAuthor) await assertFounderExists(nextAuthor);
  const previousImageCount = countContentImages(
    Boolean(existing.mainImageId),
    existing.gallery.length,
  );
  await validateMediaRefs({
    mainImageId: nextMainImage,
    pdfId: nextPdf,
    galleryImageIds: nextGallery,
    previousImageCount,
  });

  const previousMediaIds = [
    existing.mainImageId,
    existing.pdfId,
    ...existing.gallery.map((g) => g.mediaAssetId),
  ].filter(Boolean) as string[];

  const updated = await prisma.$transaction(async (tx) => {
    if (input.translations) {
      for (const t of input.translations) {
        await tx.publicationTranslation.upsert({
          where: {
            publicationId_locale: {
              publicationId: id,
              locale: t.locale,
            },
          },
          create: {
            publicationId: id,
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
      await tx.publicationGalleryImage.deleteMany({
        where: { publicationId: id },
      });
      if (input.galleryImageIds.length > 0) {
        await tx.publicationGalleryImage.createMany({
          data: input.galleryImageIds.map((mediaAssetId, index) => ({
            publicationId: id,
            mediaAssetId,
            sortOrder: index,
          })),
        });
      }
    }

    const unpublishing =
      existing.status === "PUBLISHED" && nextStatus === "DRAFT";
    if (unpublishing || (input.featureOnHomepage === false && existing.featured)) {
      await tx.featuredPublication.deleteMany({
        where: { publicationId: id },
      });
    }

    await tx.publication.update({
      where: { id },
      data: {
        categoryId: nextCategoryId,
        status: nextStatus,
        publishedAt: nextPublishedAt,
        authorFounderId: nextCategory.requiresAuthor ? nextAuthor : null,
        mainImageId: nextMainImage,
        pdfId: nextPdf,
        youtubeUrl: nextYoutubeUrl,
      },
    });

    if (input.featureOnHomepage === true) {
      const current = await tx.publication.findUniqueOrThrow({
        where: { id },
        select: { status: true },
      });
      if (current.status !== "PUBLISHED") {
        throw badRequest("Only published publications can be featured.");
      }
      const existingFeatured = await tx.featuredPublication.findUnique({
        where: { publicationId: id },
      });
      if (!existingFeatured) {
        const maxOrder = await tx.featuredPublication.aggregate({
          _max: { sortOrder: true },
        });
        await tx.featuredPublication.create({
          data: {
            publicationId: id,
            sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
          },
        });
      }
    }

    return tx.publication.findUniqueOrThrow({
      where: { id },
      include: adminInclude,
    });
  });

  const nextMediaIds = [
    updated.mainImageId,
    updated.pdfId,
    ...updated.gallery.map((g) => g.mediaAssetId),
  ].filter(Boolean) as string[];
  const removed = previousMediaIds.filter((mid) => !nextMediaIds.includes(mid));
  for (const mediaId of removed) {
    await deleteMediaAssetIfOrphaned(mediaId);
  }

  revalidatePublicationPaths(updated.slug);
  return mapAdminDetail(updated);
}

export async function deletePublication(id: string): Promise<void> {
  requireDb();
  const prisma = getPrisma();
  const existing = await prisma.publication.findUnique({
    where: { id },
    include: { gallery: true },
  });
  if (!existing) throw notFound("Publication not found");

  const mediaIds = [
    existing.mainImageId,
    existing.pdfId,
    ...existing.gallery.map((g) => g.mediaAssetId),
  ].filter(Boolean) as string[];

  await prisma.$transaction(async (tx) => {
    await tx.featuredPublication.deleteMany({ where: { publicationId: id } });
    await tx.publication.delete({ where: { id } });
  });

  for (const mediaId of mediaIds) {
    await deleteMediaAssetIfOrphaned(mediaId);
  }

  revalidatePublicationPaths(existing.slug);
}
