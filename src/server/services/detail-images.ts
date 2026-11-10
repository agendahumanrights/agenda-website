import "server-only";

import { getStorage } from "@/server/storage";
import type { Locale } from "@/i18n/config";
import type { DetailMediaImage } from "@/types/media";

type MediaWithAlt = {
  id: string;
  storageKey: string;
  altTexts?: { locale: string; altText: string }[];
};

/**
 * Main image first, then gallery in sort order. Skips gallery items that
 * share the main image media id.
 */
export function buildDetailImages(input: {
  mainImage: MediaWithAlt | null;
  gallery: MediaWithAlt[];
  locale: Locale;
  fallbackAlt: string;
}): DetailMediaImage[] {
  const storage = getStorage();
  const images: DetailMediaImage[] = [];
  const seen = new Set<string>();

  const push = (asset: MediaWithAlt) => {
    if (seen.has(asset.id)) return;
    seen.add(asset.id);
    const localized =
      asset.altTexts?.find((a) => a.locale === input.locale)?.altText?.trim() ||
      asset.altTexts?.find((a) => a.altText.trim())?.altText?.trim() ||
      input.fallbackAlt;
    images.push({
      id: asset.id,
      url: storage.getPublicUrl(asset.storageKey),
      alt: localized,
    });
  };

  if (input.mainImage) push(input.mainImage);
  for (const asset of input.gallery) push(asset);
  return images;
}
