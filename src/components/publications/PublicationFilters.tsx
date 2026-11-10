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
  buildPublicationCatalogueHref,
  type CatalogueDateSort,
  DEFAULT_CATALOGUE_DATE_SORT,
} from "@/lib/catalogue-query";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { PublicationCategorySummary } from "@/types/publication";

type Applied = {
  q?: string;
  category?: string;
  sort?: CatalogueDateSort;
};

type Props = {
  locale: Locale;
  labels: Dictionary["publications"];
  catalogueLabels: Dictionary["catalogue"];
  categories: PublicationCategorySummary[];
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

function samePublicationCriteria(a: Applied, b: Applied): boolean {
  return (
    (a.q ?? "") === (b.q ?? "") &&
    a.category === b.category &&
    (a.sort ?? DEFAULT_CATALOGUE_DATE_SORT) ===
      (b.sort ?? DEFAULT_CATALOGUE_DATE_SORT)
  );
}

/**
 * Live publication filters: debounced title search + immediate category/sort.
 * Local draft state stays independent of URL remounts so the caret is preserved.
 */
export function PublicationFilters({
  locale,
  labels,
  catalogueLabels,
  categories,
  applied,
}: Props) {
  const [q, setQ] = useState(applied.q ?? "");
  const [category, setCategory] = useState<string>(applied.category ?? "ALL");
  const [sort, setSort] = useState<CatalogueDateSort>(
    applied.sort ?? DEFAULT_CATALOGUE_DATE_SORT,
  );
  const [syncedApplied, setSyncedApplied] = useState(applied);
  const composingRef = useRef(false);

  const { applyNow, scheduleSearch, wasSentByUs, noteExternalApplied } =
    useLiveCatalogueNavigation<Applied>({
      buildHref: (draft) =>
        buildPublicationCatalogueHref({
          q: draft.q,
          category: draft.category,
          sort: draft.sort,
          page: draft.page,
          locale,
        }),
      sameCriteria: samePublicationCriteria,
    });

  if (!samePublicationCriteria(applied, syncedApplied)) {
    setSyncedApplied(applied);
    if (!wasSentByUs(applied)) {
      noteExternalApplied(applied);
      setQ(applied.q ?? "");
      setCategory(applied.category ?? "ALL");
      setSort(applied.sort ?? DEFAULT_CATALOGUE_DATE_SORT);
    }
  }

  const hasCriteria =
    q.trim().length > 0 ||
    category !== "ALL" ||
    sort !== DEFAULT_CATALOGUE_DATE_SORT ||
    Boolean(applied.q || applied.category) ||
    (applied.sort != null && applied.sort !== DEFAULT_CATALOGUE_DATE_SORT);

  function criteriaFromDraft(
    nextQ: string,
    nextCategory: string,
    nextSort: CatalogueDateSort,
  ): Applied {
    return {
      q: nextQ.trim() || undefined,
      category: nextCategory === "ALL" ? undefined : nextCategory,
      sort:
        nextSort === DEFAULT_CATALOGUE_DATE_SORT ? undefined : nextSort,
    };
  }

  function onSearchChange(value: string) {
    setQ(value);
    if (composingRef.current) return;
    scheduleSearch(criteriaFromDraft(value, category, sort), value);
  }

  function onCategoryChange(value: string) {
    setCategory(value);
    applyNow(criteriaFromDraft(q, value, sort));
  }

  function onSortChange(value: CatalogueDateSort) {
    setSort(value);
    applyNow(criteriaFromDraft(q, category, value));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyNow(criteriaFromDraft(q, category, sort));
  }

  function onReset() {
    setQ("");
    setCategory("ALL");
    setSort(DEFAULT_CATALOGUE_DATE_SORT);
    applyNow({});
  }

  return (
    <CatalogueToolbar aria-label={labels.filterToolbar}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(11rem,14rem)_minmax(11rem,14rem)_auto] lg:items-end">
          <FormField id="pub-search" label={labels.searchLabel}>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-zinc-400">
                <SearchIcon />
              </span>
              <input
                id="pub-search"
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

          <FormField id="pub-category" label={labels.categoryLabel}>
            <select
              id="pub-category"
              name="category"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className={catalogueControlClassName}
            >
              <option value="ALL">{labels.filterAll}</option>
              {categories.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField id="pub-sort" label={labels.sortLabel}>
            <select
              id="pub-sort"
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

          <div className="flex flex-wrap items-center gap-2 lg:min-h-11 lg:justify-end">
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
