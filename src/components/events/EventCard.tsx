import { ContentCard } from "@/components/shared/ContentCard";
import { sitePath } from "@/i18n/pathnames";
import type { Locale } from "@/i18n/config";
import type { EventListItem } from "@/types/event";

type Props = {
  locale: Locale;
  item: EventListItem;
  badgeLabel: string;
};

export function EventCard({ locale, item, badgeLabel }: Props) {
  const href = sitePath(`/events/${item.slug}`, locale);
  const dateLabel = new Date(item.eventDate).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <ContentCard
      className="w-full"
      href={href}
      imageUrl={item.mainImageUrl}
      imageAlt={item.title}
      badge={badgeLabel}
      title={item.title}
      excerpt={item.subtitle}
      dateTime={item.eventDate}
      dateLabel={dateLabel}
    />
  );
}
