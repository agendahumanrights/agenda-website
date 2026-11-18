import { revalidatePath, revalidateTag } from "next/cache";

import { CACHE_TAGS } from "@/server/cache/tags";

/** Invalidate writer profiles and publication surfaces that show authors. */
export function revalidateWriterPaths(slug?: string): void {
  revalidateTag(CACHE_TAGS.writers, "max");
  revalidateTag(CACHE_TAGS.publications, "max");
  revalidateTag(CACHE_TAGS.homepage, "max");
  revalidatePath("/writers");
  revalidatePath("/publications");
  revalidatePath("/");
  revalidatePath("/admin/writers");
  revalidatePath("/admin/publications");
  if (slug) {
    revalidatePath(`/writers/${slug}`);
  }
}
