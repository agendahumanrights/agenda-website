import { ContentCard } from "@/components/shared/ContentCard";
import { sitePath } from "@/i18n/pathnames";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { PublicationListItem } from "@/types/publication";

type Props = {
  locale: Locale;
  item: PublicationListItem;
  categoryLabels: Dictionary["publications"];
  readMoreLabel: string;
};

export function PublicationCard({
  locale,
  item,
  categoryLabels,
  readMoreLabel,
}: Props) {
  const href = sitePath(`/publications/${item.slug}`, locale);
  const dateLabel = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const author =
    item.category.requiresAuthor && item.authorName && item.authorBioKey
      ? {
          name: item.authorName,
          bioKey: item.authorBioKey,
          byLabel: categoryLabels.authorBy,
        }
      : null;

  return (
    <ContentCard
      className="w-full"
      href={href}
      imageUrl={item.mainImageUrl}
      imageAlt={item.title}
      badge={item.category.name}
      title={item.title}
      excerpt={item.subtitle}
      readMoreLabel={readMoreLabel}
      dateTime={item.publishedAt}
      dateLabel={dateLabel}
      author={author}
      locale={locale}
    />
  );
}
