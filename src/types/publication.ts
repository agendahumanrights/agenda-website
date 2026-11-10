import type { DetailMediaImage } from "@/types/media";

/** Localized category summary attached to public/admin publication DTOs. */
export type PublicationCategorySummary = {
  id: string;
  slug: string;
  name: string;
  requiresAuthor: boolean;
};

export type PublicationCategoryAdmin = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  requiresAuthor: boolean;
  sortOrder: number;
  publicationCount: number;
  createdAt: string;
  updatedAt: string;
};

/** @deprecated Prefer category.slug — kept for gradual call-site migration. */
export const PUBLICATION_CATEGORIES = [
  "REPORT",
  "BLOG",
  "PAPER",
  "BRIEFING",
] as const;

/** @deprecated Use PublicationCategorySummary / slug strings. */
export type PublicationCategory = (typeof PUBLICATION_CATEGORIES)[number];

export const PUBLICATION_STATUSES = ["DRAFT", "PUBLISHED"] as const;

export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export type PublicationListItem = {
  id: string;
  category: PublicationCategorySummary;
  publishedAt: string | null;
  title: string;
  subtitle: string;
  slug: string;
  mainImageUrl: string | null;
  authorName: string | null;
  authorBioKey: string | null;
};

export type PublicationDetail = PublicationListItem & {
  description: string;
  pdfUrl: string | null;
  /** Optional canonical YouTube watch URL; null when unset. */
  youtubeUrl: string | null;
  /** @deprecated Prefer `images` — kept for API shape compatibility. */
  galleryImageUrls: string[];
  /** Main image first, then gallery (deduped by media id). */
  images: DetailMediaImage[];
  authorProfessionalArea: string | null;
  authorImageUrl: string | null;
};

export type AdminMediaRef = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  altAr: string | null;
  altEn: string | null;
  sortOrder?: number;
};

export type AdminPublicationListItem = {
  id: string;
  slug: string;
  category: PublicationCategorySummary;
  status: PublicationStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  title: string;
  titleAr: string | null;
  titleEn: string | null;
  mainImageUrl: string | null;
  isFeatured: boolean;
};

export type AdminPublicationDetail = {
  id: string;
  slug: string;
  categoryId: string;
  category: PublicationCategorySummary;
  status: PublicationStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  authorFounderId: string | null;
  authorName: string | null;
  authorBioKey: string | null;
  translations: {
    locale: "ar" | "en";
    title: string;
    subtitle: string;
    description: string;
  }[];
  mainImage: AdminMediaRef | null;
  pdf: AdminMediaRef | null;
  youtubeUrl: string | null;
  gallery: AdminMediaRef[];
  isFeatured: boolean;
  featuredSortOrder: number | null;
};
