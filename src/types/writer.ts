import type { AdminMediaRef } from "@/types/publication";

/** Supported social platforms for writer profiles. */
export const WRITER_SOCIAL_PLATFORMS = [
  "facebook",
  "x",
  "linkedin",
  "instagram",
  "youtube",
  "website",
] as const;

export type WriterSocialPlatform = (typeof WRITER_SOCIAL_PLATFORMS)[number];

export type WriterSocialLink = {
  platform: WriterSocialPlatform;
  url: string;
};

/** Admin publication author picker / public summary. */
export type WriterSummary = {
  id: string;
  slug: string;
  fullName: string;
  major: string;
  email: string | null;
  profileImageUrl: string | null;
};

export type WriterPublicProfile = WriterSummary & {
  socialLinks: WriterSocialLink[];
  /** Localized Markdown biography; empty when not yet provided. */
  biography: string;
};

export type AdminWriterListItem = {
  id: string;
  slug: string;
  email: string | null;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  fullNameAr: string | null;
  fullNameEn: string | null;
  major: string;
  profileImageUrl: string | null;
  publicationCount: number;
};

export type AdminWriterDetail = {
  id: string;
  slug: string;
  email: string | null;
  createdAt: string;
  updatedAt: string;
  publicationCount: number;
  socialLinks: WriterSocialLink[];
  translations: {
    locale: "ar" | "en";
    fullName: string;
    major: string;
    biography: string;
  }[];
  profileImage: AdminMediaRef | null;
};
