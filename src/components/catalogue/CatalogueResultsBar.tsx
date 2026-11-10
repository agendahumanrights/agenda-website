import Link from "next/link";

import type { Dictionary } from "@/i18n/dictionaries";

export type CatalogueChip = {
  id: string;
  label: string;
  /** Href after removing this chip (other filters preserved, page reset). */
  removeHref: string;
};

type Props = {
  labels: Dictionary["catalogue"];
  summary: string;
  chips: CatalogueChip[];
  clearAllHref: string;
  hasActiveFilters: boolean;
};

export function CatalogueResultsBar({
  labels,
  summary,
  chips,
  clearAllHref,
  hasActiveFilters,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <p
        className="text-sm text-zinc-600"
        aria-live="polite"
        aria-atomic="true"
      >
        {summary}
      </p>
      {hasActiveFilters && chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <ul className="flex flex-wrap gap-2" aria-label={labels.appliedFilters}>
            {chips.map((chip) => (
              <li key={chip.id}>
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-zinc-200 bg-white py-1 ps-3 pe-1 text-sm text-zinc-800">
                  <span className="truncate">{chip.label}</span>
                  <Link
                    href={chip.removeHref}
                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-[var(--brand-blue)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]"
                    aria-label={`${labels.removeFilter}: ${chip.label}`}
                  >
                    <span aria-hidden="true">×</span>
                  </Link>
                </span>
              </li>
            ))}
          </ul>
          <Link
            href={clearAllHref}
            className="text-sm font-medium text-[var(--brand-blue)] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]"
          >
            {labels.clearAll}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
