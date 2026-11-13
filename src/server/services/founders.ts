import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { Prisma } from "@/generated/prisma";

import { slugify } from "@/lib/slugs";
import { revalidateFounderPaths } from "@/server/cache/founders";
import { CACHE_TAGS } from "@/server/cache/tags";
import {
  getPrisma,
  isDatabaseConfigured,
  withDatabaseFallback,
  withInteractiveTransaction,
} from "@/server/db";

import {
  badRequest,
  conflict,
  notFound,
  serviceUnavailable,
} from "@/server/http/errors";
import {
  assertMediaReady,
  deleteMediaAssetIfOrphaned,
  mapMediaRef,
} from "@/server/services/media";
import { getStorage } from "@/server/storage";
import type { Locale } from "@/i18n/config";
import type {
  AdminFounderListQuery,
  CreateFounderBody,
  ReorderFoundersBody,
  UpdateFounderBody,
} from "@/server/validations/founders";
import type { PaginatedResult } from "@/types/api";
import type {
  AdminFounderDetail,
  AdminFounderListItem,
  FounderDetail,
  FounderSummary,
} from "@/types/founder";

/**
 * Founders are blog authors and appear on About Us.
 * Scope update: managed via Admin Dashboard (supersedes requirements §2.5 founder restriction).
 * Organization vision/mission remain outside admin.
 *
 * Rules:
 * - Create/update require complete ar+en name, professional area, biography, email, profile image.
 * - bioKey is generated on create and immutable afterward.
 * - Delete is rejected (409) while any publication (draft or published) references the founder.
 * - Biography is plain text (whitespace-preserved), not Markdown/HTML.
 */

function requireDb() {
  if (!isDatabaseConfigured()) {
    throw serviceUnavailable("Database is not configured.");
  }
}

function pickName(
  translations: { locale: string; fullName: string }[],
  preferred: "ar" | "en",
): string {
  const preferredRow = translations.find((t) => t.locale === preferred);
  if (preferredRow?.fullName.trim()) return preferredRow.fullName;
  return translations.find((t) => t.fullName.trim())?.fullName ?? "";
}

export async function listFounders(locale: Locale): Promise<FounderSummary[]> {
  return withDatabaseFallback(async () => {
    const prisma = getPrisma();
    const rows = await prisma.founder.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        profileImage: true,
        translations: { where: { locale }, take: 1 },
      },
    });

    const storage = getStorage();
    return rows
      .filter((r) => r.translations[0])
      .map((r) => ({
        id: r.id,
        bioKey: r.bioKey,
        fullName: r.translations[0]!.fullName,
        professionalArea: r.translations[0]!.professionalArea,
        email: r.email,
        profileImageUrl: r.profileImage
          ? storage.getPublicUrl(r.profileImage.storageKey)
          : null,
      }));
  }, []);
}

/** Public About Us biographies in display order. */
export async function listFounderBiographies(
  locale: Locale,
): Promise<FounderDetail[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.founders);

  return withDatabaseFallback(async () => {
    const prisma = getPrisma();
    const rows = await prisma.founder.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        bioKey: true,
        email: true,
        profileImage: { select: { storageKey: true } },
        translations: {
          where: { locale },
          take: 1,
          select: {
            fullName: true,
            professionalArea: true,
            biography: true,
          },
        },
      },
    });

    const storage = getStorage();
    return rows
      .filter((r) => r.translations[0])
      .map((r) => ({
        id: r.id,
        bioKey: r.bioKey,
        fullName: r.translations[0]!.fullName,
        professionalArea: r.translations[0]!.professionalArea,
        email: r.email,
        profileImageUrl: r.profileImage
          ? storage.getPublicUrl(r.profileImage.storageKey)
          : null,
        biography: r.translations[0]!.biography,
      }));
  }, []);
}

export async function getFounderByBioKey(
  locale: Locale,
  bioKey: string,
): Promise<FounderDetail> {
  if (!isDatabaseConfigured()) {
    throw notFound("Founder not found");
  }

  const prisma = getPrisma();
  const row = await prisma.founder.findUnique({
    where: { bioKey },
    include: {
      profileImage: true,
      translations: { where: { locale }, take: 1 },
    },
  });

  if (!row || !row.translations[0]) {
    throw notFound("Founder not found");
  }

  const storage = getStorage();
  return {
    id: row.id,
    bioKey: row.bioKey,
    fullName: row.translations[0].fullName,
    professionalArea: row.translations[0].professionalArea,
    email: row.email,
    profileImageUrl: row.profileImage
      ? storage.getPublicUrl(row.profileImage.storageKey)
      : null,
    biography: row.translations[0].biography,
  };
}

const adminInclude = {
  profileImage: { include: { altTexts: true } },
  translations: true,
  _count: { select: { publications: true } },
} satisfies Prisma.FounderInclude;

function mapAdminDetail(
  row: Prisma.FounderGetPayload<{ include: typeof adminInclude }>,
): AdminFounderDetail {
  return {
    id: row.id,
    bioKey: row.bioKey,
    email: row.email ?? "",
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    publicationCount: row._count.publications,
    translations: row.translations.map((t) => ({
      locale: t.locale,
      fullName: t.fullName,
      professionalArea: t.professionalArea,
      biography: t.biography,
    })),
    profileImage: row.profileImage ? mapMediaRef(row.profileImage) : null,
  };
}

async function ensureUniqueBioKey(
  base: string,
  excludeId?: string,
): Promise<string> {
  const prisma = getPrisma();
  let candidate = base || `founder-${Date.now().toString(36)}`;
  candidate = candidate.slice(0, 120);
  for (let i = 0; i < 50; i++) {
    const bioKey = i === 0 ? candidate : `${candidate.slice(0, 100)}-${i + 1}`;
    const existing = await prisma.founder.findUnique({
      where: { bioKey },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return bioKey;
  }
  throw conflict("Could not allocate a unique bioKey.");
}

function assertCompleteTranslations(
  translations: {
    locale: string;
    fullName: string;
    professionalArea: string;
    biography: string;
  }[],
): void {
  const byLocale = new Map(translations.map((t) => [t.locale, t]));
  for (const locale of ["ar", "en"] as const) {
    const t = byLocale.get(locale);
    if (
      !t ||
      !t.fullName.trim() ||
      !t.professionalArea.trim() ||
      !t.biography.trim()
    ) {
      throw badRequest(
        `Complete ${locale.toUpperCase()} full name, professional area, and biography are required.`,
      );
    }
  }
}

export async function listAdminFounders(
  query: AdminFounderListQuery,
): Promise<PaginatedResult<AdminFounderListItem>> {
  requireDb();
  const prisma = getPrisma();

  const where: Prisma.FounderWhereInput = {
    ...(query.q
      ? {
          translations: {
            some: {
              fullName: { contains: query.q, mode: "insensitive" },
            },
          },
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.founder.count({ where }),
    prisma.founder.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        profileImage: true,
        translations: true,
        _count: { select: { publications: true } },
      },
    }),
  ]);

  const storage = getStorage();
  const items: AdminFounderListItem[] = rows.map((row) => {
    const fullNameAr =
      row.translations.find((t) => t.locale === "ar")?.fullName ?? null;
    const fullNameEn =
      row.translations.find((t) => t.locale === "en")?.fullName ?? null;
    const preferred =
      row.translations.find((t) => t.locale === query.locale) ??
      row.translations[0];
    return {
      id: row.id,
      bioKey: row.bioKey,
      email: row.email ?? "",
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      fullName: pickName(row.translations, query.locale),
      fullNameAr,
      fullNameEn,
      professionalArea: preferred?.professionalArea ?? "",
      profileImageUrl: row.profileImage
        ? storage.getPublicUrl(row.profileImage.storageKey)
        : null,
      publicationCount: row._count.publications,
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

export async function getAdminFounderById(
  id: string,
): Promise<AdminFounderDetail> {
  requireDb();
  const prisma = getPrisma();
  const row = await prisma.founder.findUnique({
    where: { id },
    include: adminInclude,
  });
  if (!row) throw notFound("Founder not found");
  return mapAdminDetail(row);
}

export async function createFounder(
  input: CreateFounderBody,
): Promise<AdminFounderDetail> {
  requireDb();
  assertCompleteTranslations(input.translations);
  await assertMediaReady({ id: input.profileImageId, expectedKind: "IMAGE" });

  const enName =
    input.translations.find((t) => t.locale === "en")?.fullName ||
    input.translations[0]?.fullName ||
    "";
  const baseKey = input.bioKey?.trim() || slugify(enName) || "founder";
  const bioKey = await ensureUniqueBioKey(baseKey);

  const prisma = getPrisma();
  const maxOrder = await prisma.founder.aggregate({ _max: { sortOrder: true } });
  const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  try {
    const created = await prisma.founder.create({
      data: {
        bioKey,
        email: input.email.trim().toLowerCase(),
        profileImageId: input.profileImageId,
        sortOrder,
        translations: {
          create: input.translations.map((t) => ({
            locale: t.locale,
            fullName: t.fullName.trim(),
            professionalArea: t.professionalArea.trim(),
            biography: t.biography.trim(),
          })),
        },
      },
      include: adminInclude,
    });

    revalidateFounderPaths();
    return mapAdminDetail(created);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict("A founder with this bioKey already exists.");
    }
    throw error;
  }
}

export async function updateFounder(
  id: string,
  input: UpdateFounderBody,
): Promise<AdminFounderDetail> {
  requireDb();
  const prisma = getPrisma();
  const existing = await prisma.founder.findUnique({
    where: { id },
    include: { translations: true },
  });
  if (!existing) throw notFound("Founder not found");

  const nextEmail =
    input.email !== undefined ? input.email.trim().toLowerCase() : existing.email;
  const nextImageId =
    input.profileImageId !== undefined
      ? input.profileImageId
      : existing.profileImageId;
  const nextTranslations =
    input.translations ??
    existing.translations.map((t) => ({
      locale: t.locale,
      fullName: t.fullName,
      professionalArea: t.professionalArea,
      biography: t.biography,
    }));

  assertCompleteTranslations(nextTranslations);
  if (!nextEmail) throw badRequest("Email is required.");
  if (!nextImageId) throw badRequest("Profile image is required.");
  await assertMediaReady({ id: nextImageId, expectedKind: "IMAGE" });

  const previousImageId = existing.profileImageId;

  const updated = await withInteractiveTransaction(async (tx) => {
    if (input.translations) {
      for (const t of input.translations) {
        await tx.founderTranslation.upsert({
          where: {
            founderId_locale: { founderId: id, locale: t.locale },
          },
          create: {
            founderId: id,
            locale: t.locale,
            fullName: t.fullName.trim(),
            professionalArea: t.professionalArea.trim(),
            biography: t.biography.trim(),
          },
          update: {
            fullName: t.fullName.trim(),
            professionalArea: t.professionalArea.trim(),
            biography: t.biography.trim(),
          },
        });
      }
    }

    await tx.founder.update({
      where: { id },
      data: {
        email: nextEmail,
        profileImageId: nextImageId,
      },
    });

    return tx.founder.findUniqueOrThrow({
      where: { id },
      include: adminInclude,
    });
  });

  if (previousImageId && previousImageId !== nextImageId) {
    await deleteMediaAssetIfOrphaned(previousImageId);
  }

  revalidateFounderPaths();
  return mapAdminDetail(updated);
}

export async function deleteFounder(id: string): Promise<void> {
  requireDb();
  const prisma = getPrisma();

  const existing = await prisma.founder.findUnique({
    where: { id },
    include: {
      _count: { select: { publications: true } },
      publications: {
        select: { id: true, slug: true, status: true },
        take: 20,
      },
    },
  });
  if (!existing) throw notFound("Founder not found");

  if (existing._count.publications > 0) {
    throw conflict(
      "Cannot delete a founder linked to publications. Reassign or remove those publications first.",
      {
        publicationCount: existing._count.publications,
        publications: existing.publications.map((p) => ({
          id: p.id,
          slug: p.slug,
          status: p.status,
        })),
      },
    );
  }

  const imageId = existing.profileImageId;

  try {
    await withInteractiveTransaction(async (tx) => {
      await tx.founder.delete({ where: { id } });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw conflict(
        "Cannot delete a founder linked to publications. Reassign or remove those publications first.",
      );
    }
    throw error;
  }

  if (imageId) {
    await deleteMediaAssetIfOrphaned(imageId);
  }

  revalidateFounderPaths();
}

/**
 * Complete founder list for display-order controls (not paginated / not filtered).
 */
export async function listAllAdminFoundersOrdered(
  locale: Locale,
): Promise<AdminFounderListItem[]> {
  requireDb();
  const prisma = getPrisma();
  const storage = getStorage();

  const rows = await prisma.founder.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      profileImage: true,
      translations: true,
      _count: { select: { publications: true } },
    },
  });

  return rows.map((row) => {
    const fullNameAr =
      row.translations.find((t) => t.locale === "ar")?.fullName ?? null;
    const fullNameEn =
      row.translations.find((t) => t.locale === "en")?.fullName ?? null;
    const preferred =
      row.translations.find((t) => t.locale === locale) ?? row.translations[0];
    return {
      id: row.id,
      bioKey: row.bioKey,
      email: row.email ?? "",
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      fullName: pickName(row.translations, locale),
      fullNameAr,
      fullNameEn,
      professionalArea: preferred?.professionalArea ?? "",
      profileImageUrl: row.profileImage
        ? storage.getPublicUrl(row.profileImage.storageKey)
        : null,
      publicationCount: row._count.publications,
    };
  });
}

/**
 * Replace display order using a complete ordered ID list.
 * Rejects missing, unexpected, or duplicate IDs.
 */
export async function reorderFounders(
  input: ReorderFoundersBody,
): Promise<void> {
  requireDb();
  const prisma = getPrisma();
  const ids = input.founderIds;

  await withInteractiveTransaction(async (tx) => {
    const all = await tx.founder.findMany({ select: { id: true } });
    const allIds = new Set(all.map((f) => f.id));
    if (ids.length !== allIds.size) {
      throw conflict(
        "Founders were added or removed while you were reordering. Close the dialog, reopen it, and try again.",
        { expectedCount: allIds.size, receivedCount: ids.length },
      );
    }
    for (const id of ids) {
      if (!allIds.has(id)) {
        throw conflict(
          "Founders were added or removed while you were reordering. Close the dialog, reopen it, and try again.",
        );
      }
    }

    for (let index = 0; index < ids.length; index++) {
      await tx.founder.update({
        where: { id: ids[index] },
        data: { sortOrder: index },
      });
    }
  });

  revalidateFounderPaths();
}
