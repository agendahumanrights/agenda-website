import { ArticleMarkdown } from "@/components/shared/ArticleMarkdown";
import { ContentDetailHero } from "@/components/shared/ContentDetailHero";
import { ShareControls } from "@/components/shared/ShareControls";
import { YouTubeEmbed } from "@/components/shared/YouTubeEmbed";
import { Container } from "@/components/layout/Container";
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

  const galleryLabels = {
    previous: shared.previous,
    next: shared.next,
    imageOf: shared.imageOf,
    goToImage: shared.goToImage,
    gallery: shared.gallery,
    imageFailed: shared.imageFailed,
  };

  return (
    <>
      <ContentDetailHero
        locale={locale}
        breadcrumbLabel={shared.breadcrumbNav}
        breadcrumbs={[
          { label: navHome, href: sitePath("/", locale) },
          { label: labels.title, href: sitePath("/events", locale) },
          { label: event.title },
        ]}
        badge={labels.categoryEvent}
        title={event.title}
        subtitle={event.subtitle}
        images={event.images}
        fallbackImageUrl={event.mainImageUrl}
        fallbackImageAlt={event.title}
        dateTime={event.eventDate}
        dateLabel={dateLabel}
        galleryLabels={galleryLabels}
      />

      <Container className="pb-12 sm:pb-16 lg:pb-20">
        <article className="mx-auto flex w-full max-w-6xl flex-col gap-8 pt-8 sm:gap-10 sm:pt-10 xl:max-w-7xl">
          <div className="flex justify-end border-b border-[var(--border)] pb-6 sm:pb-8">
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
          </div>

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
            arabicArticleFont
            className="w-full max-w-[80ch] me-auto"
          />
        </article>
      </Container>
    </>
  );
}
