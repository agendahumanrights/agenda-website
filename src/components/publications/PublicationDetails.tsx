import { ArticleMarkdown } from "@/components/shared/ArticleMarkdown";
import { ContentDetailHero } from "@/components/shared/ContentDetailHero";
import { ShareControls } from "@/components/shared/ShareControls";
import { YouTubeEmbed } from "@/components/shared/YouTubeEmbed";
import { PublicationPdfActions } from "@/components/publications/PublicationPdfActions";
import { Container } from "@/components/layout/Container";
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
  const hasPdf = Boolean(publication.pdfUrl);

  const shareLabels = {
    share: shared.share,
    shareOnX: shared.shareOnX,
    shareOnFacebook: shared.shareOnFacebook,
    shareOnLinkedIn: shared.shareOnLinkedIn,
    shareByEmail: shared.shareByEmail,
    copyLink: shared.copyLink,
    copySuccess: shared.copySuccess,
    copyFailed: shared.copyFailed,
  };

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
          { label: labels.title, href: sitePath("/publications", locale) },
          { label: publication.title },
        ]}
        badge={categoryLabel}
        title={publication.title}
        subtitle={publication.subtitle}
        images={publication.images}
        fallbackImageUrl={publication.mainImageUrl}
        fallbackImageAlt={publication.title}
        dateTime={publication.publishedAt}
        dateLabel={dateLabel}
        authors={publication.authors.map((author) => ({
          name: author.name,
          slug: author.slug,
        }))}
        byLabel={
          publication.authors.length > 0 ? labels.authorBy : undefined
        }
        galleryLabels={galleryLabels}
      />

      <Container className="pb-12 sm:pb-16 lg:pb-20">
        <article className="mx-auto flex w-full max-w-6xl flex-col gap-8 overflow-visible pt-8 sm:gap-10 sm:pt-10 xl:max-w-7xl">
          {hasPdf ? (
            <div className="flex justify-end border-b border-[var(--border)] pb-6 sm:pb-8">
              <PublicationPdfActions
                url={publication.pdfUrl}
                labels={{
                  viewPdf: labels.viewPdf,
                  downloadPdf: labels.downloadPdf,
                  downloadFailed: labels.pdfDownloadFailed,
                }}
              />
            </div>
          ) : null}

          <section
            aria-label={labels.title}
            className="grid w-full grid-cols-1 gap-6 overflow-visible lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-10"
          >
            <div className="flex min-w-0 flex-col gap-8 sm:gap-10">
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
                arabicArticleFont
                className="w-full break-words [overflow-wrap:anywhere]"
              />
            </div>

            <aside className="relative order-first min-h-0 overflow-visible lg:order-none">
              <div className="z-20 w-fit max-lg:ms-0 lg:ms-auto lg:sticky lg:top-[var(--site-header-offset)]">
                <ShareControls
                  title={publication.title}
                  path={sharePath}
                  labels={shareLabels}
                />
              </div>
            </aside>
          </section>
        </article>
      </Container>
    </>
  );
}
