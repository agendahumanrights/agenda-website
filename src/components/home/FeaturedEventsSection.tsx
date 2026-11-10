import { EventGrid } from "@/components/events/EventGrid";
import { SectionHeader } from "@/components/home/SectionHeader";
import { sitePath } from "@/i18n/pathnames";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { EventListItem } from "@/types/event";

type Props = {
  locale: Locale;
  items: EventListItem[];
  labels: Dictionary["home"];
  eventLabels: Dictionary["events"];
  emptyLabel: string;
};

export function FeaturedEventsSection({
  locale,
  items,
  labels,
  eventLabels,
  emptyLabel,
}: Props) {
  return (
    <div className="flex flex-col gap-6 sm:gap-7 lg:gap-8">
      <SectionHeader
        id="featured-events-heading"
        label={labels.eventsSectionLabel}
        title={labels.featuredEvents}
        description={labels.eventsSectionDescription}
        action={{
          href: sitePath("/events", locale),
          label: labels.viewAllEvents,
        }}
      />
      <EventGrid
        locale={locale}
        items={items}
        emptyLabel={emptyLabel}
        readMoreLabel={eventLabels.readMore}
        badgeLabel={eventLabels.categoryEvent}
        variant="home"
      />
    </div>
  );
}
