export function formatResultsSummary(
  template: string,
  input: { page: number; pageSize: number; total: number },
): string {
  if (input.total === 0) {
    return template
      .replace("{from}", "0")
      .replace("{to}", "0")
      .replace("{total}", "0");
  }
  const from = (input.page - 1) * input.pageSize + 1;
  const to = Math.min(input.page * input.pageSize, input.total);
  return template
    .replace("{from}", String(from))
    .replace("{to}", String(to))
    .replace("{total}", String(input.total));
}

/** Prefer the localized category name from the DTO; fall back to slug. */
export function publicationCategoryLabel(
  category: { name?: string; slug?: string } | string,
): string {
  if (typeof category === "string") return category;
  return category.name || category.slug || "";
}
