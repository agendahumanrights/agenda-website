import type { AdminMediaRef } from "@/types/publication";

export type FounderSummary = {
  id: string;
  bioKey: string;
  fullName: string;
  professionalArea: string;
  email: string | null;
  profileImageUrl: string | null;
};

export type FounderDetail = FounderSummary & {
  biography: string;
};

export type AdminFounderListItem = {
  id: string;
  bioKey: string;
  email: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  fullNameAr: string | null;
  fullNameEn: string | null;
  professionalArea: string;
  profileImageUrl: string | null;
  publicationCount: number;
};

export type AdminFounderDetail = {
  id: string;
  bioKey: string;
  email: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  publicationCount: number;
  translations: {
    locale: "ar" | "en";
    fullName: string;
    professionalArea: string;
    biography: string;
  }[];
  profileImage: AdminMediaRef | null;
};
