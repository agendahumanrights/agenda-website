import Link from "next/link";

import { cn } from "@/lib/utils";

type Props = {
  page: number;
  totalPages: number;
  previousLabel: string;
  nextLabel: string;
  pageOfLabel: string;
  /** Build href for a 1-based page number; preserves filter criteria. */
  hrefForPage: (page: number) => string;
};

/**
 * Link-based pagination. Hidden when there is only one page (or none).
 */
export function Pagination({
  page,
  totalPages,
  previousLabel,
  nextLabel,
  pageOfLabel,
  hrefForPage,
}: Props) {
  if (totalPages <= 1) return null;

  const hasPrevious = page > 1;
  const hasNext = page < totalPages;
  const linkClass =
    "inline-flex min-h-10 items-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 transition hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]";
  const disabledClass =
    "inline-flex min-h-10 cursor-not-allowed items-center rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-400";

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-700"
    >
      {hasPrevious ? (
        <Link
          href={hrefForPage(page - 1)}
          className={linkClass}
          rel="prev"
        >
          {previousLabel}
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">
          {previousLabel}
        </span>
      )}
      <span aria-current="page" className="text-center text-zinc-600">
        {pageOfLabel
          .replace("{page}", String(page))
          .replace("{totalPages}", String(totalPages))}
      </span>
      {hasNext ? (
        <Link href={hrefForPage(page + 1)} className={cn(linkClass)} rel="next">
          {nextLabel}
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">
          {nextLabel}
        </span>
      )}
    </nav>
  );
}
