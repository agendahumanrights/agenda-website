"use client";

import { useRef, useState, type FormEvent } from "react";

import {
  CatalogueToolbar,
  catalogueControlClassName,
  catalogueSecondaryButtonClassName,
} from "@/components/catalogue/CatalogueToolbar";
import { useLiveCatalogueNavigation } from "@/components/catalogue/useLiveCatalogueNavigation";
import { FormField } from "@/components/ui/FormField";
import {
  buildEventCatalogueHref,
  type CatalogueDateSort,
  DEFAULT_CATALOGUE_DATE_SORT,
} from "@/lib/catalogue-query";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type Applied = {
  q?: string;
  sort?: CatalogueDateSort;
};

type Props = {
  locale: Locale;
  labels: Dictionary["events"];
  catalogueLabels: Dictionary["catalogue"];
  applied: Applied;
};

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="M20 20l-3.5-3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function sameEventCriteria(a: Applied, b: Applied): boolean {
  return (
    (a.q ?? "") === (b.q ?? "") &&
    (a.sort ?? DEFAULT_CATALOGUE_DATE_SORT) ===
      (b.sort ?? DEFAULT_CATALOGUE_DATE_SORT)
  );
}

/**
 * Live events title search (debounced) + date sort.
 * Sorts by admin-selected `eventDate`, not creation timestamps.
 */
export function EventDateFilter({
  locale,
  labels,
  catalogueLabels,
  applied,
}: Props) {
  const [q, setQ] = useState(applied.q ?? "");
  const [sort, setSort] = useState<CatalogueDateSort>(
    applied.sort ?? DEFAULT_CATALOGUE_DATE_SORT,
  );
  const [syncedApplied, setSyncedApplied] = useState(applied);
  const composingRef = useRef(false);

  const { applyNow, scheduleSearch, wasSentByUs, noteExternalApplied } =
    useLiveCatalogueNavigation<Applied>({
      buildHref: (draft) =>
        buildEventCatalogueHref({
          q: draft.q,
          sort: draft.sort,
          page: draft.page,
          locale,
        }),
      sameCriteria: sameEventCriteria,
    });

  if (!sameEventCriteria(applied, syncedApplied)) {
    setSyncedApplied(applied);
    if (!wasSentByUs(applied)) {
      noteExternalApplied(applied);
      setQ(applied.q ?? "");
      setSort(applied.sort ?? DEFAULT_CATALOGUE_DATE_SORT);
    }
  }

  const hasCriteria =
    q.trim().length > 0 ||
    sort !== DEFAULT_CATALOGUE_DATE_SORT ||
    Boolean(applied.q) ||
    (applied.sort != null && applied.sort !== DEFAULT_CATALOGUE_DATE_SORT);

  function criteriaFromDraft(
    nextQ: string,
    nextSort: CatalogueDateSort,
  ): Applied {
    return {
      q: nextQ.trim() || undefined,
      sort:
        nextSort === DEFAULT_CATALOGUE_DATE_SORT ? undefined : nextSort,
    };
  }

  function onSearchChange(value: string) {
    setQ(value);
    if (composingRef.current) return;
    scheduleSearch(criteriaFromDraft(value, sort), value);
  }

  function onSortChange(value: CatalogueDateSort) {
    setSort(value);
    applyNow(criteriaFromDraft(q, value));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyNow(criteriaFromDraft(q, sort));
  }

  function onReset() {
    setQ("");
    setSort(DEFAULT_CATALOGUE_DATE_SORT);
    applyNow({});
  }

  return (
    <CatalogueToolbar aria-label={labels.filterToolbar}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(11rem,14rem)_auto] sm:items-end">
          <FormField id="event-search" label={labels.searchLabel}>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-zinc-400">
                <SearchIcon />
              </span>
              <input
                id="event-search"
                name="q"
                type="search"
                value={q}
                onChange={(e) => onSearchChange(e.target.value)}
                onCompositionStart={() => {
                  composingRef.current = true;
                }}
                onCompositionEnd={(e) => {
                  composingRef.current = false;
                  onSearchChange(e.currentTarget.value);
                }}
                placeholder={labels.searchPlaceholder}
                autoComplete="off"
                className={cn(catalogueControlClassName, "ps-10")}
              />
            </div>
          </FormField>

          <FormField id="event-sort" label={labels.sortLabel}>
            <select
              id="event-sort"
              name="sort"
              value={sort}
              onChange={(e) =>
                onSortChange(e.target.value as CatalogueDateSort)
              }
              className={catalogueControlClassName}
            >
              <option value="newest">{labels.sortNewest}</option>
              <option value="oldest">{labels.sortOldest}</option>
            </select>
          </FormField>

          <div className="flex flex-wrap items-center gap-2 sm:min-h-11 sm:justify-end">
            {hasCriteria ? (
              <button
                type="button"
                onClick={onReset}
                className={catalogueSecondaryButtonClassName}
              >
                {catalogueLabels.reset}
              </button>
            ) : null}
          </div>
        </div>
      </form>
    </CatalogueToolbar>
  );
}
