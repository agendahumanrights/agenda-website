import type { PublicationCategorySummary } from "@/types/publication";

type Props = {
  category: PublicationCategorySummary;
  className?: string;
};

/** Small badge showing a localized category name. */
export function PublicationCategoryBadge({ category, className }: Props) {
  return (
    <span
      className={
        className ??
        "inline-flex rounded-full bg-[var(--admin-accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--brand-blue)]"
      }
    >
      {category.name}
    </span>
  );
}
