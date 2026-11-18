import { revalidatePath, revalidateTag } from "next/cache";

import { CACHE_TAGS } from "@/server/cache/tags";

/** Invalidate About Us and admin founder views after founder writes. */
export function revalidateFounderPaths(): void {
  try {
    revalidateTag(CACHE_TAGS.founders, "max");
    revalidatePath("/about");
    revalidatePath("/admin/founders");
  } catch (error) {
    console.warn("revalidatePath skipped:", error);
  }
}
