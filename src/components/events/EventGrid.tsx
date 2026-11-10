import { EventCard } from "@/components/events/EventCard";
import { HomeFeaturedGrid } from "@/components/home/HomeFeaturedGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Locale } from "@/i18n/config";
import type { EventListItem } from "@/types/event";

type Props = {
  locale: Locale;
  items: EventListItem[];
  emptyLabel: string;
  readMoreLabel: string;
  badgeLabel: string;
  /** Center sparse rows on the homepage; listing pages keep a full 3-col grid. */
  variant?: "default" | "home";
};

export function EventGrid({
  locale,
  items,
  emptyLabel,
  readMoreLabel,
  badgeLabel,
  variant = "default",
}: Props) {
  if (items.length === 0) {
    return <EmptyState title={emptyLabel} />;
  }

  const cards = items.map((item) => (
    <li key={item.id} className="flex min-w-0">
      <EventCard
        locale={locale}
        item={item}
        readMoreLabel={readMoreLabel}
        badgeLabel={badgeLabel}
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
