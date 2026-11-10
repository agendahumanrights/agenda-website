import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { ArticleMarkdown } from "@/components/shared/ArticleMarkdown";
import { MediaGallery } from "@/components/shared/MediaGallery";
import { ShareControls } from "@/components/shared/ShareControls";
import { YouTubeEmbed } from "@/components/shared/YouTubeEmbed";
import { PublicationAuthor } from "@/components/publications/PublicationAuthor";
import { PublicationPdfActions } from "@/components/publications/PublicationPdfActions";
import { sitePath } from "@/i18n/pathnames";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { PublicationDetail } from "@/types/publication";

type Props = {
  locale: Locale;
  publication: PublicationDetail;
  labels: Dictionary["publications"];
  shared: Dictionary["shared"];
  navHome: string;
};

export function PublicationDetails({
  locale,
  publication,
  labels,
  shared,
  navHome,
}: Props) {
  const categoryLabel = publication.category.name;
  const dateLabel = publication.publishedAt
    ? new Date(publication.publishedAt).toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const sharePath = sitePath(`/publications/${publication.slug}`, locale);

  return (
    <article className="flex flex-col gap-8 sm:gap-10">
      <Breadcrumbs
        label={shared.breadcrumbNav}
        items={[
          { label: navHome, href: sitePath("/", locale) },
          { label: labels.title, href: sitePath("/publications", locale) },
          { label: publication.title },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-12">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm tracking-wide">
            <span className="font-semibold text-[var(--brand-blue)] uppercase underline decoration-2 underline-offset-8">
              {categoryLabel}
            </span>
            {dateLabel && publication.publishedAt ? (
              <>
                <span aria-hidden className="text-zinc-300">
                  |
                </span>
                <time
                  dateTime={publication.publishedAt}
                  className="text-[var(--brand-gray)]"
                >
                  {dateLabel}
                </time>
              </>
            ) : null}
          </div>

          <h1 className="font-editorial mt-5 text-[clamp(1.85rem,4.5vw,3rem)] leading-[1.2] font-semibold text-balance text-[var(--brand-blue)]">
            {publication.title}
          </h1>

          {publication.subtitle ? (
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-600 text-pretty sm:text-lg">
              {publication.subtitle}
            </p>
          ) : null}

          {publication.category.requiresAuthor &&
          publication.authorName &&
          publication.authorBioKey ? (
            <PublicationAuthor
              className="mt-6"
              name={publication.authorName}
              bioKey={publication.authorBioKey}
              professionalArea={publication.authorProfessionalArea}
              imageUrl={publication.authorImageUrl}
              locale={locale}
            />
          ) : null}
        </div>

        <div className="flex flex-col gap-5 sm:gap-6 lg:pt-1">
          <ShareControls
            title={publication.title}
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
          <PublicationPdfActions
            url={publication.pdfUrl}
            labels={{
              viewPdf: labels.viewPdf,
              downloadPdf: labels.downloadPdf,
              downloadFailed: labels.pdfDownloadFailed,
            }}
          />
        </div>
      </div>

      <MediaGallery
        images={publication.images}
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

      {publication.youtubeUrl ? (
        <YouTubeEmbed
          url={publication.youtubeUrl}
          title={publication.title}
          heading={shared.watchVideo}
        />
      ) : null}

      <ArticleMarkdown
        source={publication.description}
        locale={locale}
        className="max-w-3xl"
      />
    </article>
  );
}
