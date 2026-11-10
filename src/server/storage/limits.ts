/** Configurable upload/gallery limits (bytes and counts). */

function envInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Total images per publication/event (1 main + gallery). */
const maxImagesPerItem = envInt("UPLOAD_MAX_IMAGES_PER_ITEM", 10);

export const MEDIA_LIMITS = {
  maxImageBytes: envInt("UPLOAD_MAX_IMAGE_BYTES", 5 * 1024 * 1024),
  maxPdfBytes: envInt("UPLOAD_MAX_PDF_BYTES", 20 * 1024 * 1024),
  /**
   * Combined main + gallery cap for publications and events.
   * Default 10 (1 main + up to 9 gallery when a main image is set).
   */
  maxImagesPerItem,
  /**
   * Gallery-only slots when a main image occupies one of the total slots.
   * Derived from `maxImagesPerItem` so both stay in sync.
   */
  maxGalleryImages: Math.max(0, maxImagesPerItem - 1),
} as const;

export const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const ALLOWED_PDF_MIME = new Set(["application/pdf"]);
