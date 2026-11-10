import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/lib/seo/locale-url";

export const CATALOGUE_PAGE_SIZE = 12;

/** Public catalogue date sort (admin-selected dates, not createdAt). */
export const CATALOGUE_DATE_SORTS = ["newest", "oldest"] as const;
export type CatalogueDateSort = (typeof CATALOGUE_DATE_SORTS)[number];
export const DEFAULT_CATALOGUE_DATE_SORT: CatalogueDateSort = "newest";

type RawParams = Record<string, string | string[] | undefined>;

function first(raw: RawParams, key: string): string | undefined {
  const value = raw[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

function parsePage(raw: RawParams): number {
  const n = Number(first(raw, "page"));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function parseOptionalQuery(raw: RawParams): string | undefined {
  const q = first(raw, "q")?.trim();
  return q ? q.slice(0, 200) : undefined;
}

const CATEGORY_SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

function parseCategorySlug(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 160) return undefined;
  if (!CATEGORY_SLUG_RE.test(trimmed)) return undefined;
  return trimmed;
}

export function parseCatalogueDateSort(
  value: string | undefined,
): CatalogueDateSort {
  if (value === "oldest") return "oldest";
  return DEFAULT_CATALOGUE_DATE_SORT;
}

/** Parse public publications catalogue URL params (invalid values ignored). */
export function parsePublicationCatalogueParams(raw: RawParams): {
  q?: string;
  category?: string;
  sort: CatalogueDateSort;
  page: number;
  pageSize: number;
} {
  return {
    q: parseOptionalQuery(raw),
    category: parseCategorySlug(first(raw, "category")),
    sort: parseCatalogueDateSort(first(raw, "sort")),
    page: parsePage(raw),
    pageSize: CATALOGUE_PAGE_SIZE,
  };
}

/**
 * Parse public events catalogue URL params.
 * Only `q`, `sort`, and `page` are applied — `createdFrom`/`createdTo` are ignored so
 * legacy date query strings no longer filter the public Events page.
 */
export function parseEventCatalogueParams(raw: RawParams): {
  q?: string;
  sort: CatalogueDateSort;
  page: number;
  pageSize: number;
} {
  return {
    q: parseOptionalQuery(raw),
    sort: parseCatalogueDateSort(first(raw, "sort")),
    page: parsePage(raw),
    pageSize: CATALOGUE_PAGE_SIZE,
  };
}

export function buildPublicationCatalogueHref(input: {
  q?: string;
  category?: string;
  sort?: CatalogueDateSort;
  page?: number;
  locale?: Locale;
}): string {
  const params: Record<string, string | undefined> = {};
  const q = input.q?.trim();
  if (q) params.q = q;
  if (input.category && input.category !== "ALL") {
    params.category = input.category;
  }
  if (input.sort && input.sort !== DEFAULT_CATALOGUE_DATE_SORT) {
    params.sort = input.sort;
  }
  if (input.page && input.page > 1) params.page = String(input.page);
  return localizedHref("/publications", input.locale ?? "en", params);
}

export function buildEventCatalogueHref(input: {
  q?: string;
  sort?: CatalogueDateSort;
  page?: number;
  locale?: Locale;
}): string {
  const params: Record<string, string | undefined> = {};
  const q = input.q?.trim();
  if (q) params.q = q;
  if (input.sort && input.sort !== DEFAULT_CATALOGUE_DATE_SORT) {
    params.sort = input.sort;
  }
  if (input.page && input.page > 1) params.page = String(input.page);
  return localizedHref("/events", input.locale ?? "en", params);
}

export function clampCataloguePage(
  page: number,
  totalPages: number,
): number {
  if (totalPages <= 0) return 1;
  return Math.min(Math.max(1, page), totalPages);
}

/** True when catalogue URL has filter/sort/search that should not be indexed. */
export function catalogueHasIndexableFilters(input: {
  q?: string;
  category?: string;
  sort?: CatalogueDateSort;
}): boolean {
  return Boolean(
    input.q ||
      input.category ||
      (input.sort && input.sort !== DEFAULT_CATALOGUE_DATE_SORT),
  );
}
