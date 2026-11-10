import { HomeFeaturedGrid } from "@/components/home/HomeFeaturedGrid";
import { PublicationCard } from "@/components/publications/PublicationCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { PublicationListItem } from "@/types/publication";

type Props = {
  locale: Locale;
  items: PublicationListItem[];
  emptyLabel: string;
  categoryLabels: Dictionary["publications"];
  readMoreLabel: string;
  /** Center sparse rows on the homepage; listing pages keep a full 3-col grid. */
  variant?: "default" | "home";
};

export function PublicationGrid({
  locale,
  items,
  emptyLabel,
  categoryLabels,
  readMoreLabel,
  variant = "default",
}: Props) {
  if (items.length === 0) {
    return <EmptyState title={emptyLabel} />;
  }

  const cards = items.map((item) => (
    <li key={item.id} className="flex min-w-0">
      <PublicationCard
        locale={locale}
        item={item}
        categoryLabels={categoryLabels}
        readMoreLabel={readMoreLabel}
      />
    </li>
  ));

  if (variant === "home") {
    return <HomeFeaturedGrid count={items.length}>{cards}</HomeFeaturedGrid>;
  }

  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
      {cards}
    </ul>
  );
}
