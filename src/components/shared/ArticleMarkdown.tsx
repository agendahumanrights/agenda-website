import { MarkdownContent } from "@/components/shared/MarkdownContent";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Props = {
  source: string;
  locale: Locale;
  className?: string;
};

/** Safe Markdown with editorial article typography (shared with admin preview). */
export function ArticleMarkdown({ source, locale, className }: Props) {
  return (
    <MarkdownContent
      source={source}
      dir={locale === "ar" ? "rtl" : "ltr"}
      shiftHeadings
      className={cn("article-prose", className)}
    />
  );
}
