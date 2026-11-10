/**
 * Shared helpers for publication/event image counts (main + gallery).
 * Safe for client and server — no env access; pass the configured max.
 */

export function countContentImages(
  hasMainImage: boolean,
  galleryCount: number,
): number {
  return (hasMainImage ? 1 : 0) + galleryCount;
}

/** Remaining upload slots (0 when at or over the configured total). */
export function remainingContentImageSlots(
  hasMainImage: boolean,
  galleryCount: number,
  maxImagesPerItem: number,
): number {
  return Math.max(
    0,
    maxImagesPerItem - countContentImages(hasMainImage, galleryCount),
  );
}

/**
 * Whether a new total is allowed.
 * Over-limit existing records may keep or reduce their count, but not increase it.
 */
export function isContentImageCountAllowed(
  nextCount: number,
  maxImagesPerItem: number,
  previousCount?: number,
): boolean {
  if (nextCount <= maxImagesPerItem) return true;
  if (previousCount !== undefined && nextCount <= previousCount) return true;
  return false;
}
