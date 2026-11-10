import "server-only";

import { Prisma } from "@/generated/prisma";
import { revalidatePublicationPaths } from "@/server/cache/publications";
import { getPrisma, isDatabaseConfigured } from "@/server/db";
import {
  badRequest,
  conflict,
  notFound,
  serviceUnavailable,
} from "@/server/http/errors";
import { slugify } from "@/lib/slugs";
import type { PaginatedResult } from "@/types/api";
import type {
  PublicationCategoryAdmin,
  PublicationCategorySummary,
} from "@/types/publication";
import type {
  AdminPublicationCategoryListQuery,
  CreatePublicationCategoryBody,
  UpdatePublicationCategoryBody,
} from "@/server/validations/categories";

function requireDb() {
  if (!isDatabaseConfigured()) {
    throw serviceUnavailable("Database is not configured.");
  }
}

export function localizeCategoryName(
  row: { nameEn: string; nameAr: string },
  locale: "ar" | "en",
): string {
  return locale === "ar" ? row.nameAr : row.nameEn;
}

export function mapCategorySummary(
  row: {
    id: string;
    slug: string;
    nameEn: string;
    nameAr: string;
    requiresAuthor: boolean;
  },
  locale: "ar" | "en",
): PublicationCategorySummary {
  return {
    id: row.id,
    slug: row.slug,
    name: localizeCategoryName(row, locale),
    requiresAuthor: row.requiresAuthor,
  };
}

function mapAdminCategory(
  row: {
    id: string;
    slug: string;
    nameEn: string;
    nameAr: string;
    requiresAuthor: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    _count: { publications: number };
  },
): PublicationCategoryAdmin {
  return {
    id: row.id,
    slug: row.slug,
    nameEn: row.nameEn,
    nameAr: row.nameAr,
    requiresAuthor: row.requiresAuthor,
    sortOrder: row.sortOrder,
    publicationCount: row._count.publications,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function ensureUniqueCategorySlug(base: string): Promise<string> {
  const prisma = getPrisma();
  let candidate = base || `category-${Date.now().toString(36)}`;
  candidate = candidate.slice(0, 160);
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? candidate : `${candidate.slice(0, 140)}-${i + 1}`;
    const existing = await prisma.publicationCategory.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) return slug;
  }
  throw conflict("Could not allocate a unique category slug.");
}

async function assertUniqueNames(
  nameEn: string,
  nameAr: string,
  excludeId?: string,
): Promise<void> {
  const prisma = getPrisma();
  const [enHit, arHit] = await Promise.all([
    prisma.publicationCategory.findFirst({
      where: {
        nameEn: { equals: nameEn, mode: "insensitive" },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    }),
    prisma.publicationCategory.findFirst({
      where: {
        nameAr: { equals: nameAr, mode: "insensitive" },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    }),
  ]);
  if (enHit) throw conflict("A category with this English name already exists.");
  if (arHit) throw conflict("A category with this Arabic name already exists.");
}

export async function listPublicationCategories(
  locale: "ar" | "en" = "ar",
): Promise<PublicationCategorySummary[]> {
  if (!isDatabaseConfigured()) return [];
  const prisma = getPrisma();
  const rows = await prisma.publicationCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
  });
  return rows.map((row) => mapCategorySummary(row, locale));
}

export async function listAdminPublicationCategories(
  query: AdminPublicationCategoryListQuery,
): Promise<PaginatedResult<PublicationCategoryAdmin>> {
  requireDb();
  const prisma = getPrisma();
  const where: Prisma.PublicationCategoryWhereInput = query.q
    ? {
        OR: [
          { nameEn: { contains: query.q, mode: "insensitive" } },
          { nameAr: { contains: query.q, mode: "insensitive" } },
          { slug: { contains: query.q, mode: "insensitive" } },
        ],
      }
    : {};

  const [total, rows] = await Promise.all([
    prisma.publicationCategory.count({ where }),
    prisma.publicationCategory.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { _count: { select: { publications: true } } },
    }),
  ]);

  return {
    items: rows.map(mapAdminCategory),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.pageSize),
    },
  };
}

export async function getPublicationCategoryById(
  id: string,
): Promise<PublicationCategoryAdmin> {
  requireDb();
  const prisma = getPrisma();
  const row = await prisma.publicationCategory.findUnique({
    where: { id },
    include: { _count: { select: { publications: true } } },
  });
  if (!row) throw notFound("Category not found");
  return mapAdminCategory(row);
}

export async function createPublicationCategory(
  input: CreatePublicationCategoryBody,
): Promise<PublicationCategoryAdmin> {
  requireDb();
  const nameEn = input.nameEn.trim();
  const nameAr = input.nameAr.trim();
  await assertUniqueNames(nameEn, nameAr);

  const baseSlug = slugify(nameEn) || `category-${Date.now().toString(36)}`;
  const slug = await ensureUniqueCategorySlug(baseSlug);

  const prisma = getPrisma();
  const maxOrder = await prisma.publicationCategory.aggregate({
    _max: { sortOrder: true },
  });

  try {
    const created = await prisma.publicationCategory.create({
      data: {
        nameEn,
        nameAr,
        slug,
        requiresAuthor: false,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
      include: { _count: { select: { publications: true } } },
    });
    revalidatePublicationPaths();
    return mapAdminCategory(created);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict("A category with this name or slug already exists.");
    }
    throw error;
  }
}

export async function updatePublicationCategory(
  id: string,
  input: UpdatePublicationCategoryBody,
): Promise<PublicationCategoryAdmin> {
  requireDb();
  const prisma = getPrisma();
  const existing = await prisma.publicationCategory.findUnique({
    where: { id },
  });
  if (!existing) throw notFound("Category not found");

  const nameEn =
    input.nameEn !== undefined ? input.nameEn.trim() : existing.nameEn;
  const nameAr =
    input.nameAr !== undefined ? input.nameAr.trim() : existing.nameAr;

  if (!nameEn || !nameAr) {
    throw badRequest("English and Arabic names are required.");
  }
  await assertUniqueNames(nameEn, nameAr, id);

  try {
    const updated = await prisma.publicationCategory.update({
      where: { id },
      data: { nameEn, nameAr },
      include: { _count: { select: { publications: true } } },
    });
    revalidatePublicationPaths();
    return mapAdminCategory(updated);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict("A category with this name already exists.");
    }
    throw error;
  }
}

export async function deletePublicationCategory(id: string): Promise<void> {
  requireDb();
  const prisma = getPrisma();
  const existing = await prisma.publicationCategory.findUnique({
    where: { id },
    include: { _count: { select: { publications: true } } },
  });
  if (!existing) throw notFound("Category not found");
  if (existing._count.publications > 0) {
    throw badRequest(
      `This category is assigned to ${existing._count.publications} publication(s). Reassign those publications before deleting.`,
    );
  }

  await prisma.publicationCategory.delete({ where: { id } });
  revalidatePublicationPaths();
}

export async function assertCategoryExists(id: string): Promise<{
  id: string;
  slug: string;
  requiresAuthor: boolean;
}> {
  const prisma = getPrisma();
  const row = await prisma.publicationCategory.findUnique({
    where: { id },
    select: { id: true, slug: true, requiresAuthor: true },
  });
  if (!row) throw badRequest("Selected category does not exist.");
  return row;
}
