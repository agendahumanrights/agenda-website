import { PublicationAuthor } from "@/components/publications/PublicationAuthor";
import type { Locale } from "@/i18n/config";
import type { PublicationAuthorDetail } from "@/types/publication";
import { cn } from "@/lib/utils";

type Props = {
  authors: PublicationAuthorDetail[];
  writtenByLabel: string;
  locale: Locale;
  className?: string;
};

/**
 * Public publication author block. One author keeps the classic stacked
 * portrait layout; multiple authors use a compact wrapping row.
 */
export function PublicationAuthors({
  authors,
  writtenByLabel,
  locale,
  className,
}: Props) {
  if (authors.length === 0) return null;

  if (authors.length === 1) {
    const author = authors[0]!;
    return (
      <PublicationAuthor
        name={author.name}
        slug={author.slug}
        major={author.major}
        imageUrl={author.imageUrl}
        locale={locale}
        className={className}
      />
    );
  }

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <p className="text-sm font-medium text-zinc-600">{writtenByLabel}</p>
      <ul className="flex list-none flex-wrap items-center gap-x-4 gap-y-3">
        {authors.map((author) => (
          <li key={author.id} className="min-w-0">
            <PublicationAuthor
              name={author.name}
              slug={author.slug}
              major={author.major}
              imageUrl={author.imageUrl}
              locale={locale}
              className="gap-2.5"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
