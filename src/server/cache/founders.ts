import { revalidatePath } from "next/cache";

/** Invalidate About Us and author-linked public views after founder writes. */
export function revalidateFounderPaths(): void {
  try {
    revalidatePath("/about");
    revalidatePath("/publications");
    revalidatePath("/");
    revalidatePath("/admin/founders");
    revalidatePath("/admin/publications");
  } catch (error) {
    console.warn("revalidatePath skipped:", error);
  }
}
