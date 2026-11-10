import { revalidatePath, revalidateTag } from "next/cache";

import { CACHE_TAGS } from "@/server/cache/tags";

/** Invalidate public publication-related views after admin writes. */
export function revalidatePublicationPaths(slug?: string): void {
  try {
    revalidateTag(CACHE_TAGS.publications, "max");
    revalidateTag(CACHE_TAGS.homepage, "max");
    revalidateTag(CACHE_TAGS.categories, "max");
    revalidatePath("/");
    revalidatePath("/publications");
    if (slug) {
      revalidatePath(`/publications/${slug}`);
    }
    revalidatePath("/admin/publications");
    revalidatePath("/admin/publications/categories");
    revalidatePath("/admin/homepage");
  } catch (error) {
    // Cache APIs may be unavailable outside a Next.js request context (e.g. unit tests).
    console.warn("revalidatePath skipped:", error);
  }
}
