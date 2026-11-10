import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { ArticleMarkdown } from "@/components/shared/ArticleMarkdown";
import { MediaGallery } from "@/components/shared/MediaGallery";
import { ShareControls } from "@/components/shared/ShareControls";
import { YouTubeEmbed } from "@/components/shared/YouTubeEmbed";
import { sitePath } from "@/i18n/pathnames";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { EventDetail } from "@/types/event";

type Props = {
  locale: Locale;
  event: EventDetail;
  labels: Dictionary["events"];
  shared: Dictionary["shared"];
  navHome: string;
};

export function EventDetails({
  locale,
  event,
  labels,
  shared,
  navHome,
}: Props) {
  const dateLabel = new Date(event.eventDate).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const sharePath = sitePath(`/events/${event.slug}`, locale);

  return (
    <article className="flex flex-col gap-8 sm:gap-10">
      <Breadcrumbs
        label={shared.breadcrumbNav}
        items={[
          { label: navHome, href: sitePath("/", locale) },
          { label: labels.title, href: sitePath("/events", locale) },
          { label: event.title },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-12">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm tracking-wide">
            <span className="font-semibold text-[var(--brand-blue)] uppercase underline decoration-2 underline-offset-8">
              {labels.categoryEvent}
            </span>
            <span aria-hidden className="text-zinc-300">
              |
            </span>
            <time dateTime={event.eventDate} className="text-[var(--brand-gray)]">
              {dateLabel}
            </time>
          </div>

          <h1 className="font-editorial mt-5 text-[clamp(1.85rem,4.5vw,3rem)] leading-[1.2] font-semibold text-balance text-[var(--brand-blue)]">
            {event.title}
          </h1>

          {event.subtitle ? (
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-600 text-pretty sm:text-lg">
              {event.subtitle}
            </p>
          ) : null}
        </div>

        <ShareControls
          className="lg:pt-1"
          title={event.title}
          path={sharePath}
          labels={{
            share: shared.share,
            shareOnX: shared.shareOnX,
            shareOnFacebook: shared.shareOnFacebook,
            shareOnLinkedIn: shared.shareOnLinkedIn,
            shareByEmail: shared.shareByEmail,
            copyLink: shared.copyLink,
            copySuccess: shared.copySuccess,
            copyFailed: shared.copyFailed,
          }}
        />
      </div>

      <MediaGallery
        images={event.images}
        labels={{
          gallery: shared.gallery,
          previous: shared.previous,
          next: shared.next,
          enlarge: shared.enlarge,
          close: shared.close,
          imageOf: shared.imageOf,
          imageFailed: shared.imageFailed,
          goToImage: shared.goToImage,
        }}
      />

      {event.youtubeUrl ? (
        <YouTubeEmbed
          url={event.youtubeUrl}
          title={event.title}
          heading={shared.watchVideo}
        />
      ) : null}

      <ArticleMarkdown
        source={event.description}
        locale={locale}
        className="max-w-3xl"
      />
    </article>
  );
}
