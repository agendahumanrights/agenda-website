import { MarkdownContent } from "@/components/shared/MarkdownContent";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Props = {
  source: string;
  locale: Locale;
  className?: string;
  /**
   * When true and `locale` is `ar`, adds `.article-prose--arabic` (IBM Plex body).
   * Arabic pages also pick up Cairo headings + IBM Plex from `html[lang="ar"]`.
   */
  arabicArticleFont?: boolean;
};

/**
 * Safe Markdown with editorial article typography.
 * Body paragraphs use justified alignment via `.article-prose` (opt out with
 * `.article-prose--align-start`). Arabic uses Cairo headings + IBM Plex body.
 */
export function ArticleMarkdown({
  source,
  locale,
  className,
  arabicArticleFont = false,
}: Props) {
  const useArabicArticleFont = arabicArticleFont && locale === "ar";

  return (
    <MarkdownContent
      source={source}
      dir={locale === "ar" ? "rtl" : "ltr"}
      shiftHeadings
      className={cn(
        "article-prose w-full min-w-0",
        useArabicArticleFont && "article-prose--arabic",
        className,
      )}
    />
  );
}
