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
    <article className="mx-auto flex w-full max-w-6xl flex-col gap-8 sm:gap-10 xl:max-w-7xl">
      <Breadcrumbs
        label={shared.breadcrumbNav}
        items={[
          { label: navHome, href: sitePath("/", locale) },
          { label: labels.title, href: sitePath("/events", locale) },
          { label: event.title },
        ]}
      />

      <header className="flex flex-col gap-6 border-b border-[var(--border)] pb-8 sm:gap-7 sm:pb-10 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="min-w-0 flex-1">
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

          <h1 className="font-editorial mt-4 text-[clamp(1.85rem,4vw,3.15rem)] leading-[1.15] font-semibold text-balance text-[var(--brand-blue)] sm:mt-5">
            {event.title}
          </h1>

          {event.subtitle ? (
            <p className="mt-4 max-w-4xl text-base leading-relaxed text-zinc-600 text-pretty sm:mt-5 sm:text-lg sm:leading-relaxed">
              {event.subtitle}
            </p>
          ) : null}
        </div>

        <aside className="flex shrink-0 lg:pt-1">
          <ShareControls
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
        </aside>
      </header>

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
        className="w-full"
      />
    </article>
  );
}
