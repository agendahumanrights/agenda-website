import { MarkdownContent } from "@/components/shared/MarkdownContent";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Props = {
  source: string;
  locale: Locale;
  className?: string;
  /**
   * When true and `locale` is `ar`, apply IBM Plex Sans Arabic via
   * `.article-prose--arabic`. Used for public publication/event bodies only —
   * not writer bios, admin preview, or other Arabic UI.
   */
  arabicArticleFont?: boolean;
};

/**
 * Safe Markdown with editorial article typography.
 * Body paragraphs use justified alignment via `.article-prose` (opt out with
 * `.article-prose--align-start`). Callers set the reading measure.
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
