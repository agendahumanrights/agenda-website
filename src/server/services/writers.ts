import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { Prisma } from "@/generated/prisma";

import { slugify } from "@/lib/slugs";
import { revalidateWriterPaths } from "@/server/cache/writers";
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
  AdminWriterListQuery,
  CreateWriterBody,
  UpdateWriterBody,
} from "@/server/validations/writers";
import type { PaginatedResult } from "@/types/api";
import type {
  AdminWriterDetail,
  AdminWriterListItem,
  WriterPublicProfile,
  WriterSocialLink,
  WriterSummary,
} from "@/types/writer";
import { WRITER_SOCIAL_PLATFORMS } from "@/types/writer";

/**
 * Writers are publication authors with public profiles at /writers/{slug}.
 * Independent from Founders (About Us).
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

function parseSocialLinks(value: unknown): WriterSocialLink[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(WRITER_SOCIAL_PLATFORMS);
  const out: WriterSocialLink[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as { platform?: unknown; url?: unknown };
    if (typeof row.platform !== "string" || typeof row.url !== "string") continue;
    if (!allowed.has(row.platform) || seen.has(row.platform)) continue;
    const url = row.url.trim();
    if (!/^https?:\/\//i.test(url)) continue;
    seen.add(row.platform);
    out.push({
      platform: row.platform as WriterSocialLink["platform"],
      url,
    });
  }
  return out;
}

const adminInclude = {
  profileImage: { include: { altTexts: true } },
  translations: true,
  _count: { select: { publicationAuthors: true } },
} satisfies Prisma.WriterInclude;

function mapAdminDetail(
  row: Prisma.WriterGetPayload<{ include: typeof adminInclude }>,
): AdminWriterDetail {
  return {
    id: row.id,
    slug: row.slug,
    email: row.email,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    publicationCount: row._count.publicationAuthors,
    socialLinks: parseSocialLinks(row.socialLinks),
    translations: row.translations.map((t) => ({
      locale: t.locale,
      fullName: t.fullName,
      major: t.major,
      biography: t.biography,
    })),
    profileImage: row.profileImage ? mapMediaRef(row.profileImage) : null,
  };
}

async function ensureUniqueSlug(
  base: string,
  excludeId?: string,
): Promise<string> {
  const prisma = getPrisma();
  let candidate = base || `writer-${Date.now().toString(36)}`;
  candidate = candidate.slice(0, 120);
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? candidate : `${candidate.slice(0, 100)}-${i + 1}`;
    const existing = await prisma.writer.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return slug;
  }
  throw conflict("Could not allocate a unique writer slug.");
}

function assertCompleteTranslations(
  translations: {
    locale: string;
    fullName: string;
    major: string;
    biography: string;
  }[],
): void {
  const byLocale = new Map(translations.map((t) => [t.locale, t]));
  for (const locale of ["ar", "en"] as const) {
    const t = byLocale.get(locale);
    if (!t || !t.fullName.trim() || !t.biography.trim()) {
      throw badRequest(
        `Complete ${locale.toUpperCase()} full name and biography are required.`,
      );
    }
  }
}

/** Locale-filtered writer options for publication author dropdowns. */
export async function listWriters(locale: Locale): Promise<WriterSummary[]> {
  return withDatabaseFallback(async () => {
    const prisma = getPrisma();
    const rows = await prisma.writer.findMany({
      orderBy: { createdAt: "asc" },
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
        slug: r.slug,
        fullName: r.translations[0]!.fullName,
        major: r.translations[0]!.major,
        email: r.email,
        profileImageUrl: r.profileImage
          ? storage.getPublicUrl(r.profileImage.storageKey)
          : null,
      }));
  }, []);
}

export async function getWriterBySlug(
  slug: string,
  locale: Locale,
): Promise<WriterPublicProfile> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.writers);

  if (!isDatabaseConfigured()) {
    throw notFound("Writer not found");
  }

  const prisma = getPrisma();
  const row = await prisma.writer.findUnique({
    where: { slug },
    include: {
      profileImage: true,
      translations: { where: { locale }, take: 1 },
    },
  });

  if (!row || !row.translations[0]) {
    throw notFound("Writer not found");
  }

  const storage = getStorage();
  return {
    id: row.id,
    slug: row.slug,
    fullName: row.translations[0].fullName,
    major: row.translations[0].major,
    email: row.email,
    profileImageUrl: row.profileImage
      ? storage.getPublicUrl(row.profileImage.storageKey)
      : null,
    socialLinks: parseSocialLinks(row.socialLinks),
    biography: row.translations[0].biography ?? "",
  };
}

export async function listAdminWriters(
  query: AdminWriterListQuery,
): Promise<PaginatedResult<AdminWriterListItem>> {
  requireDb();
  const prisma = getPrisma();

  const where: Prisma.WriterWhereInput = {
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
    prisma.writer.count({ where }),
    prisma.writer.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        profileImage: true,
        translations: true,
        _count: { select: { publicationAuthors: true } },
      },
    }),
  ]);

  const storage = getStorage();
  const items: AdminWriterListItem[] = rows.map((row) => {
    const fullNameAr =
      row.translations.find((t) => t.locale === "ar")?.fullName ?? null;
    const fullNameEn =
      row.translations.find((t) => t.locale === "en")?.fullName ?? null;
    const preferred =
      row.translations.find((t) => t.locale === query.locale) ??
      row.translations[0];
    return {
      id: row.id,
      slug: row.slug,
      email: row.email,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      fullName: pickName(row.translations, query.locale),
      fullNameAr,
      fullNameEn,
      major: preferred?.major ?? "",
      profileImageUrl: row.profileImage
        ? storage.getPublicUrl(row.profileImage.storageKey)
        : null,
      publicationCount: row._count.publicationAuthors,
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

export async function getAdminWriterById(
  id: string,
): Promise<AdminWriterDetail> {
  requireDb();
  const prisma = getPrisma();
  const row = await prisma.writer.findUnique({
    where: { id },
    include: adminInclude,
  });
  if (!row) throw notFound("Writer not found");
  return mapAdminDetail(row);
}

export async function createWriter(
  input: CreateWriterBody,
): Promise<AdminWriterDetail> {
  requireDb();
  assertCompleteTranslations(input.translations);
  await assertMediaReady({ id: input.profileImageId, expectedKind: "IMAGE" });

  const enName =
    input.translations.find((t) => t.locale === "en")?.fullName ||
    input.translations[0]?.fullName ||
    "";
  const baseSlug = input.slug?.trim() || slugify(enName) || "writer";
  const slug = await ensureUniqueSlug(baseSlug);
  const socialLinks = input.socialLinks ?? [];

  const prisma = getPrisma();
  try {
    const created = await prisma.writer.create({
      data: {
        slug,
        email: input.email ? input.email.trim().toLowerCase() : null,
        profileImageId: input.profileImageId,
        socialLinks,
        translations: {
          create: input.translations.map((t) => ({
            locale: t.locale,
            fullName: t.fullName.trim(),
            major: t.major.trim(),
            biography: t.biography.trim(),
          })),
        },
      },
      include: adminInclude,
    });

    revalidateWriterPaths(slug);
    return mapAdminDetail(created);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict("A writer with this slug already exists.");
    }
    throw error;
  }
}

export async function updateWriter(
  id: string,
  input: UpdateWriterBody,
): Promise<AdminWriterDetail> {
  requireDb();
  const prisma = getPrisma();
  const existing = await prisma.writer.findUnique({
    where: { id },
    include: { translations: true },
  });
  if (!existing) throw notFound("Writer not found");

  const nextEmail =
    input.email !== undefined
      ? input.email
        ? input.email.trim().toLowerCase()
        : null
      : existing.email;
  const nextImageId =
    input.profileImageId !== undefined
      ? input.profileImageId
      : existing.profileImageId;
  const nextSocial =
    input.socialLinks !== undefined
      ? input.socialLinks
      : parseSocialLinks(existing.socialLinks);
  const nextTranslations =
    input.translations ??
    existing.translations.map((t) => ({
      locale: t.locale,
      fullName: t.fullName,
      major: t.major,
      biography: t.biography,
    }));

  assertCompleteTranslations(nextTranslations);
  if (!nextImageId) throw badRequest("Profile image is required.");
  await assertMediaReady({ id: nextImageId, expectedKind: "IMAGE" });

  const previousImageId = existing.profileImageId;

  const updated = await withInteractiveTransaction(async (tx) => {
    if (input.translations) {
      for (const t of input.translations) {
        await tx.writerTranslation.upsert({
          where: {
            writerId_locale: { writerId: id, locale: t.locale },
          },
          create: {
            writerId: id,
            locale: t.locale,
            fullName: t.fullName.trim(),
            major: t.major.trim(),
            biography: t.biography.trim(),
          },
          update: {
            fullName: t.fullName.trim(),
            major: t.major.trim(),
            biography: t.biography.trim(),
          },
        });
      }
    }

    await tx.writer.update({
      where: { id },
      data: {
        email: nextEmail,
        profileImageId: nextImageId,
        socialLinks: nextSocial,
      },
    });

    return tx.writer.findUniqueOrThrow({
      where: { id },
      include: adminInclude,
    });
  });

  if (previousImageId && previousImageId !== nextImageId) {
    await deleteMediaAssetIfOrphaned(previousImageId);
  }

  revalidateWriterPaths(existing.slug);
  return mapAdminDetail(updated);
}

export async function deleteWriter(id: string): Promise<void> {
  requireDb();
  const prisma = getPrisma();

  const existing = await prisma.writer.findUnique({
    where: { id },
    include: {
      _count: { select: { publicationAuthors: true } },
      publicationAuthors: {
        take: 20,
        select: {
          publication: { select: { id: true, slug: true, status: true } },
        },
      },
    },
  });
  if (!existing) throw notFound("Writer not found");

  if (existing._count.publicationAuthors > 0) {
    throw conflict(
      "Cannot delete a writer linked to publications. Reassign or remove those publications first.",
      {
        publicationCount: existing._count.publicationAuthors,
        publications: existing.publicationAuthors.map((link) => ({
          id: link.publication.id,
          slug: link.publication.slug,
          status: link.publication.status,
        })),
      },
    );
  }

  const imageId = existing.profileImageId;
  const slug = existing.slug;

  try {
    await prisma.writer.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw conflict(
        "Cannot delete a writer linked to publications. Reassign or remove those publications first.",
      );
    }
    throw error;
  }

  if (imageId) {
    await deleteMediaAssetIfOrphaned(imageId);
  }

  revalidateWriterPaths(slug);
}

/** Slugs for sitemap generation. */
export async function listWriterSlugsForSitemap(): Promise<string[]> {
  return withDatabaseFallback(async () => {
    const prisma = getPrisma();
    const rows = await prisma.writer.findMany({
      select: { slug: true },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((r) => r.slug);
  }, []);
}
