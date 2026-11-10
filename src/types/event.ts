import type { DetailMediaImage } from "@/types/media";
import type { AdminMediaRef } from "@/types/publication";

export const EVENT_STATUSES = ["DRAFT", "PUBLISHED"] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

export type EventListItem = {
  id: string;
  eventDate: string;
  createdAt: string;
  title: string;
  subtitle: string;
  slug: string;
  mainImageUrl: string | null;
};

export type EventDetail = EventListItem & {
  description: string;
  /** Optional canonical YouTube watch URL; null when unset. */
  youtubeUrl: string | null;
  /** @deprecated Prefer `images` — kept for API shape compatibility. */
  galleryImageUrls: string[];
  /** Main image first, then gallery (deduped by media id). */
  images: DetailMediaImage[];
};

export type AdminEventListItem = {
  id: string;
  slug: string;
  status: EventStatus;
  eventDate: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  titleAr: string | null;
  titleEn: string | null;
  mainImageUrl: string | null;
  isFeatured: boolean;
};

export type AdminEventDetail = {
  id: string;
  slug: string;
  status: EventStatus;
  eventDate: string;
  createdAt: string;
  updatedAt: string;
  translations: {
    locale: "ar" | "en";
    title: string;
    subtitle: string;
    description: string;
  }[];
  mainImage: AdminMediaRef | null;
  youtubeUrl: string | null;
  gallery: AdminMediaRef[];
  isFeatured: boolean;
  featuredSortOrder: number | null;
};
