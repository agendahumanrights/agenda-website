import { revalidatePath, revalidateTag } from "next/cache";

import { CACHE_TAGS } from "@/server/cache/tags";

/** Invalidate public event-related views after admin writes. */
export function revalidateEventPaths(slug?: string): void {
  try {
    revalidateTag(CACHE_TAGS.events, "max");
    revalidateTag(CACHE_TAGS.homepage, "max");
    revalidatePath("/");
    revalidatePath("/events");
    if (slug) {
      revalidatePath(`/events/${slug}`);
    }
    revalidatePath("/admin/events");
    revalidatePath("/admin/homepage");
  } catch (error) {
    console.warn("revalidatePath skipped:", error);
  }
}
