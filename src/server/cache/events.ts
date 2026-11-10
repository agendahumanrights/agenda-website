import { revalidatePath } from "next/cache";

/** Invalidate public event-related views after admin writes. */
export function revalidateEventPaths(slug?: string): void {
  try {
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
