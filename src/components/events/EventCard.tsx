import { ContentCard } from "@/components/shared/ContentCard";
import { sitePath } from "@/i18n/pathnames";
import type { Locale } from "@/i18n/config";
import type { EventListItem } from "@/types/event";

type Props = {
  locale: Locale;
  item: EventListItem;
  readMoreLabel: string;
  badgeLabel: string;
};

export function EventCard({ locale, item, readMoreLabel, badgeLabel }: Props) {
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
      readMoreLabel={readMoreLabel}
      dateTime={item.eventDate}
      dateLabel={dateLabel}
    />
  );
}
