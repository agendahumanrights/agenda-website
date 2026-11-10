import "server-only";

import { fromBuffer as fileTypeFromBuffer } from "file-type";

import { getPrisma, isDatabaseConfigured } from "@/server/db";
import {
  badRequest,
  forbidden,
  notFound,
  payloadTooLarge,
  serviceUnavailable,
  unsupportedMediaType,
} from "@/server/http/errors";
import {
  ALLOWED_IMAGE_MIME,
  ALLOWED_PDF_MIME,
  folderForMediaPurpose,
  getStorage,
  MEDIA_LIMITS,
} from "@/server/storage";
import type { MediaPurpose } from "@/server/validations/media";
import type { AdminMediaRef } from "@/types/publication";

type MediaKind = "IMAGE" | "PDF" | "OTHER";

function requireDb() {
  if (!isDatabaseConfigured()) {
    throw serviceUnavailable("Database is not configured.");
  }
}

function mapMediaRef(asset: {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  altTexts: { locale: "ar" | "en"; altText: string }[];
  sortOrder?: number;
}): AdminMediaRef {
  const storage = getStorage();
  return {
    id: asset.id,
    filename: asset.filename,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    url: storage.getPublicUrl(asset.storageKey),
    altAr: asset.altTexts.find((a) => a.locale === "ar")?.altText ?? null,
    altEn: asset.altTexts.find((a) => a.locale === "en")?.altText ?? null,
    sortOrder: asset.sortOrder,
  };
}

async function detectMime(buffer: Buffer): Promise<string | undefined> {
  const result = await fileTypeFromBuffer(buffer);
  return result?.mime;
}

function kindForPurpose(purpose: MediaPurpose): MediaKind {
  return purpose === "publication-pdf" ? "PDF" : "IMAGE";
}

function assertPurposeMime(purpose: MediaPurpose, mime: string) {
  if (purpose === "publication-pdf") {
    if (!ALLOWED_PDF_MIME.has(mime)) {
      throw unsupportedMediaType("Only PDF files are allowed for this upload.");
    }
    return;
  }
  if (!ALLOWED_IMAGE_MIME.has(mime)) {
    throw unsupportedMediaType(
      "Only JPEG, PNG, WebP, or GIF images are allowed.",
    );
  }
}

function maxBytesForPurpose(purpose: MediaPurpose): number {
  return purpose === "publication-pdf"
    ? MEDIA_LIMITS.maxPdfBytes
    : MEDIA_LIMITS.maxImageBytes;
}

/**
 * Upload a file, persist MediaAsset (+ optional alt texts), return admin DTO.
 * On DB failure after storage write, attempts to delete the orphaned file.
 */
export async function uploadMediaAsset(input: {
  purpose: MediaPurpose;
  filename: string;
  bytes: Buffer;
  altAr?: string;
  altEn?: string;
}): Promise<AdminMediaRef> {
  requireDb();

  const detected = await detectMime(input.bytes);
  if (!detected) {
    throw unsupportedMediaType("Could not determine file type from contents.");
  }
  assertPurposeMime(input.purpose, detected);

  const maxBytes = maxBytesForPurpose(input.purpose);
  if (input.bytes.byteLength > maxBytes) {
    throw payloadTooLarge(
      `File exceeds the ${Math.round(maxBytes / (1024 * 1024))}MB limit.`,
    );
  }

  const storage = getStorage();
  const stored = await storage.upload({
    filename: input.filename,
    mimeType: detected,
    sizeBytes: input.bytes.byteLength,
    body: input.bytes,
    folder: folderForMediaPurpose(input.purpose),
  });

  const prisma = getPrisma();
  try {
    const asset = await prisma.mediaAsset.create({
      data: {
        storageKey: stored.storageKey,
        filename: stored.filename,
        mimeType: detected,
        sizeBytes: stored.sizeBytes,
        kind: kindForPurpose(input.purpose),
        altTexts: {
          create: [
            ...(input.altAr
              ? [{ locale: "ar" as const, altText: input.altAr }]
              : []),
            ...(input.altEn
              ? [{ locale: "en" as const, altText: input.altEn }]
              : []),
          ],
        },
      },
      include: { altTexts: true },
    });
    return mapMediaRef(asset);
  } catch (error) {
    try {
      await storage.delete(stored.storageKey);
    } catch (cleanupError) {
      console.error("Failed to clean up orphaned upload", cleanupError);
    }
    throw error;
  }
}

export async function getMediaAssetById(id: string) {
  requireDb();
  const prisma = getPrisma();
  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    include: { altTexts: true },
  });
  if (!asset) throw notFound("Media asset not found");
  return asset;
}

export async function assertMediaReady(input: {
  id: string;
  expectedKind: MediaKind;
}): Promise<void> {
  const asset = await getMediaAssetById(input.id);
  if (asset.kind !== input.expectedKind && asset.kind !== "OTHER") {
    // Allow OTHER only if mime matches expected purpose checks below
  }
  if (input.expectedKind === "IMAGE") {
    if (!ALLOWED_IMAGE_MIME.has(asset.mimeType)) {
      throw badRequest("Referenced media is not a valid image.");
    }
  }
  if (input.expectedKind === "PDF") {
    if (!ALLOWED_PDF_MIME.has(asset.mimeType)) {
      throw badRequest("Referenced media is not a valid PDF.");
    }
  }
  const storage = getStorage();
  if (storage.exists && !(await storage.exists(asset.storageKey))) {
    throw badRequest("Referenced media file is missing from storage.");
  }
}

/**
 * Public or admin access check for a storage key.
 * Anonymous users only receive assets referenced by published content.
 */
export async function assertMediaAccess(
  storageKey: string,
  isAdmin: boolean,
): Promise<{ mimeType: string; filename: string }> {
  requireDb();
  const prisma = getPrisma();
  const asset = await prisma.mediaAsset.findUnique({
    where: { storageKey },
  });
  if (!asset) throw notFound("Media not found");

  if (isAdmin) {
    return { mimeType: asset.mimeType, filename: asset.filename };
  }

  const published = await isAssetPubliclyReferenced(asset.id);
  if (!published) {
    throw forbidden("This file is not publicly available.");
  }
  return { mimeType: asset.mimeType, filename: asset.filename };
}

async function isAssetPubliclyReferenced(mediaAssetId: string): Promise<boolean> {
  const prisma = getPrisma();
  // findFirst + select id is cheaper than count; run in parallel and short-circuit.
  const [asMain, asPdf, asGallery, asEventMain, asEventGallery, asFounder] =
    await Promise.all([
      prisma.publication.findFirst({
        where: { mainImageId: mediaAssetId, status: "PUBLISHED" },
        select: { id: true },
      }),
      prisma.publication.findFirst({
        where: { pdfId: mediaAssetId, status: "PUBLISHED" },
        select: { id: true },
      }),
      prisma.publicationGalleryImage.findFirst({
        where: {
          mediaAssetId,
          publication: { status: "PUBLISHED" },
        },
        select: { id: true },
      }),
      prisma.event.findFirst({
        where: { mainImageId: mediaAssetId, status: "PUBLISHED" },
        select: { id: true },
      }),
      prisma.eventGalleryImage.findFirst({
        where: {
          mediaAssetId,
          event: { status: "PUBLISHED" },
        },
        select: { id: true },
      }),
      prisma.founder.findFirst({
        where: { profileImageId: mediaAssetId },
        select: { id: true },
      }),
    ]);

  return Boolean(
    asMain || asPdf || asGallery || asEventMain || asEventGallery || asFounder,
  );
}

/** Delete physical file only when no DB rows still reference the asset. */
export async function deleteMediaAssetIfOrphaned(mediaAssetId: string): Promise<void> {
  if (!isDatabaseConfigured()) return;
  const prisma = getPrisma();
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: mediaAssetId },
    include: {
      publicationMainImages: { select: { id: true }, take: 1 },
      publicationPdfs: { select: { id: true }, take: 1 },
      publicationGallery: { select: { id: true }, take: 1 },
      eventMainImages: { select: { id: true }, take: 1 },
      eventGallery: { select: { id: true }, take: 1 },
      founderProfile: { select: { id: true } },
    },
  });
  if (!asset) return;

  const stillReferenced =
    asset.publicationMainImages.length > 0 ||
    asset.publicationPdfs.length > 0 ||
    asset.publicationGallery.length > 0 ||
    asset.eventMainImages.length > 0 ||
    asset.eventGallery.length > 0 ||
    asset.founderProfile != null;

  if (stillReferenced) return;

  const storage = getStorage();
  try {
    await storage.delete(asset.storageKey);
  } catch (error) {
    console.error("Failed to delete orphaned media file", error);
  }
  await prisma.mediaAsset.delete({ where: { id: mediaAssetId } }).catch(() => {
    /* already gone */
  });
}

export function resolvePublicMediaUrl(storageKey: string): string {
  return getStorage().getPublicUrl(storageKey);
}

export { mapMediaRef, MEDIA_LIMITS };
