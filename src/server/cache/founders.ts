import { revalidatePath, revalidateTag } from "next/cache";

import { CACHE_TAGS } from "@/server/cache/tags";

/** Invalidate About Us and author-linked public views after founder writes. */
export function revalidateFounderPaths(): void {
  try {
    revalidateTag(CACHE_TAGS.founders, "max");
    revalidateTag(CACHE_TAGS.publications, "max");
    revalidateTag(CACHE_TAGS.homepage, "max");
    revalidatePath("/about");
    revalidatePath("/publications");
    revalidatePath("/");
    revalidatePath("/admin/founders");
    revalidatePath("/admin/publications");
  } catch (error) {
    console.warn("revalidatePath skipped:", error);
  }
}
