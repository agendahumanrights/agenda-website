import {
  countContentImages,
  isContentImageCountAllowed,
} from "@/lib/content-image-limits";
import { badRequest } from "@/server/http/errors";
import { MEDIA_LIMITS } from "@/server/storage/limits";

export { countContentImages } from "@/lib/content-image-limits";

/**
 * Enforce the combined main+gallery image cap for publications and events.
 * When `previousCount` is set (updates), over-limit records may be saved if
 * the count does not increase — existing media is never auto-deleted.
 */
export function assertContentImageCountAllowed(input: {
  mainImageId?: string | null;
  galleryImageIds?: readonly string[];
  previousCount?: number;
}): void {
  const gallery = input.galleryImageIds ?? [];
  const nextCount = countContentImages(Boolean(input.mainImageId), gallery.length);
  const max = MEDIA_LIMITS.maxImagesPerItem;

  if (
    isContentImageCountAllowed(nextCount, max, input.previousCount)
  ) {
    return;
  }

  throw badRequest(
    `At most ${max} images are allowed (main image plus gallery).`,
  );
}
