"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type DragEvent,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { adminJson } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

type Option = {
  id: string;
  slug: string;
  title: string;
  titleAr: string;
  titleEn: string;
  mainImageUrl: string | null;
  isFeatured: boolean;
  eventDate?: string;
  category?: string;
  publishedAt?: string | null;
};

type SectionState = {
  selected: Option[];
  available: Option[];
  max?: number;
};

type Labels = Dictionary["admin"]["homepageAdmin"];
type CategoryLabels = Dictionary["publications"];

type Props = {
  locale: Locale;
  labels: Labels;
  categoryLabels: CategoryLabels;
  publications: SectionState;
  events: SectionState;
  initialLoadError?: boolean;
};

const AVAILABLE_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 250;

function idsEqual(a: Option[], b: Option[]) {
  if (a.length !== b.length) return false;
  return a.every((item, i) => item.id === b[i]?.id);
}

function formatDate(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function categoryLabel(
  category: string | undefined,
  labels: CategoryLabels,
): string | null {
  switch (category) {
    case "REPORT":
      return labels.categoryReport;
    case "BLOG":
      return labels.categoryBlog;
    case "PAPER":
      return labels.categoryPaper;
    case "BRIEFING":
      return labels.categoryBriefing;
    default:
      return null;
  }
}

function matchesSearch(item: Option, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    item.titleAr.toLowerCase().includes(q) ||
    item.titleEn.toLowerCase().includes(q) ||
    item.title.toLowerCase().includes(q)
  );
}

function fillTemplate(
  template: string,
  vars: Record<string, string | number>,
) {
  let text = template;
  for (const [key, value] of Object.entries(vars)) {
    text = text.replace(`{${key}}`, String(value));
  }
  return text;
}

function Thumb({
  url,
  missingLabel,
}: {
  url: string | null;
  missingLabel: string;
}) {
  if (!url) {
    return (
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[0.65rem] font-medium text-zinc-500"
        aria-hidden
      >
        {missingLabel}
      </div>
    );
  }
  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-zinc-100">
      {/* eslint-disable-next-line @next/next/no-img-element -- admin media URLs vary by storage */}
      <img src={url} alt="" className="h-full w-full object-cover" />
    </div>
  );
}

function DragHandleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="5" cy="4" r="1.25" />
      <circle cx="11" cy="4" r="1.25" />
      <circle cx="5" cy="8" r="1.25" />
      <circle cx="11" cy="8" r="1.25" />
      <circle cx="5" cy="12" r="1.25" />
      <circle cx="11" cy="12" r="1.25" />
    </svg>
  );
}

function SelectionPanel({
  kind,
  locale,
  labels,
  categoryLabels,
  initialSelected,
  catalog,
  max,
  listHref,
  saveLabel,
  savePayload,
  emptySelectedText,
  emptyNoPublishedText,
  allSelectedText,
  goToListLabel,
  searchLabel,
  savedMessage,
  savedEmptyMessage,
  onDirtyChange,
}: {
  kind: "publications" | "events";
  locale: Locale;
  labels: Labels;
  categoryLabels: CategoryLabels;
  initialSelected: Option[];
  catalog: Option[];
  max?: number;
  listHref: string;
  saveLabel: string;
  savePayload: (ids: string[]) => Record<string, unknown>;
  emptySelectedText: string;
  emptyNoPublishedText: string;
  allSelectedText: string;
  goToListLabel: string;
  searchLabel: string;
  savedMessage: string;
  savedEmptyMessage: string;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [saved, setSaved] = useState(initialSelected);
  const [selected, setSelected] = useState(initialSelected);
  const [searchDraft, setSearchDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(AVAILABLE_PAGE_SIZE);
  const [feedback, setFeedback] = useState<"idle" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const searchGen = useRef(0);

  const dirty = !idsEqual(selected, saved);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    const gen = ++searchGen.current;
    const t = window.setTimeout(() => {
      if (gen !== searchGen.current) return;
      setSearchQuery(searchDraft.trim());
      setVisibleCount(AVAILABLE_PAGE_SIZE);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchDraft]);

  const selectedIds = useMemo(
    () => new Set(selected.map((s) => s.id)),
    [selected],
  );

  const availablePool = useMemo(
    () => catalog.filter((item) => !selectedIds.has(item.id)),
    [catalog, selectedIds],
  );

  const filteredAvailable = useMemo(
    () => availablePool.filter((item) => matchesSearch(item, searchQuery)),
    [availablePool, searchQuery],
  );

  const visibleAvailable = filteredAvailable.slice(0, visibleCount);
  const hasMore = filteredAvailable.length > visibleCount;
  const atMax = typeof max === "number" && selected.length >= max;

  function setSelection(next: Option[] | ((prev: Option[]) => Option[])) {
    setSelected(next);
    setFeedback("idle");
    setError(null);
  }

  function announceMsg(template: string, vars: Record<string, string | number>) {
    setAnnounce(fillTemplate(template, vars));
  }

  function move(index: number, delta: number) {
    setSelection((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      announceMsg(labels.announcedMoved, {
        title: item.title,
        n: target + 1,
      });
      return next;
    });
  }

  function removeItem(item: Option) {
    setSelection((prev) => prev.filter((p) => p.id !== item.id));
    announceMsg(labels.announcedRemoved, { title: item.title });
  }

  function addItem(item: Option) {
    if (atMax || selectedIds.has(item.id)) return;
    setSelection((prev) => [...prev, item]);
    announceMsg(labels.announcedAdded, { title: item.title });
  }

  function reset() {
    setSelected(saved);
    setFeedback("idle");
    setError(null);
    setAnnounce("");
  }

  function save() {
    if (!dirty || pending) return;
    startTransition(async () => {
      const result = await adminJson<{ ok: boolean }>("/api/admin/homepage", {
        method: "PUT",
        body: JSON.stringify(savePayload(selected.map((s) => s.id))),
      });
      if (!result.ok) {
        const status = result.status;
        const serverMsg = result.payload.error?.message;
        if (status === 409) {
          setError(serverMsg || labels.errorConflict);
        } else {
          setError(serverMsg || labels.errorGeneric);
        }
        setFeedback("idle");
        return;
      }
      setSaved(selected);
      setError(null);
      setFeedback("saved");
    });
  }

  function onDragStart(id: string) {
    setDragId(id);
  }

  function onDragOverCard(e: DragEvent, index: number) {
    e.preventDefault();
    if (!dragId) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    setDropIndex(e.clientY < mid ? index : index + 1);
  }

  function onDropList(e: DragEvent) {
    e.preventDefault();
    if (dragId == null || dropIndex == null) {
      setDragId(null);
      setDropIndex(null);
      return;
    }
    setSelection((prev) => {
      const from = prev.findIndex((p) => p.id === dragId);
      if (from < 0) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      let to = dropIndex;
      if (from < to) to -= 1;
      to = Math.max(0, Math.min(to, next.length));
      next.splice(to, 0, item);
      announceMsg(labels.announcedMoved, { title: item.title, n: to + 1 });
      return next;
    });
    setDragId(null);
    setDropIndex(null);
  }

  function onDragEnd() {
    setDragId(null);
    setDropIndex(null);
  }

  let availableEmpty: ReactNode = null;
  if (catalog.length === 0) {
    availableEmpty = <EmptyState title={emptyNoPublishedText} />;
  } else if (availablePool.length === 0) {
    availableEmpty = <EmptyState title={allSelectedText} />;
  } else if (filteredAvailable.length === 0) {
    availableEmpty = (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-[var(--admin-border)] p-5">
        <p className="text-sm font-medium text-zinc-900">
          {labels.noSearchResults}
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setSearchDraft("");
            setSearchQuery("");
          }}
        >
          {labels.clearSearch}
        </Button>
      </div>
    );
  }

  const statusText = pending
    ? labels.statusSaving
    : dirty
      ? labels.statusUnsaved
      : labels.statusSaved;

  const successText =
    feedback === "saved"
      ? selected.length === 0
        ? savedEmptyMessage
        : savedMessage
      : null;

  return (
    <section className="admin-panel flex flex-col gap-5 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-zinc-900">
            {kind === "publications"
              ? labels.publicationsHeading
              : labels.eventsHeading}
          </h2>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            {kind === "publications"
              ? labels.publicationsDescription
              : labels.eventsDescription}
          </p>
        </div>
        {typeof max === "number" ? (
          <p
            className="rounded-md bg-[var(--admin-accent-soft)] px-3 py-1.5 text-sm font-semibold text-[var(--brand-blue)]"
            aria-live="polite"
          >
            {fillTemplate(labels.eventsCount, {
              count: selected.length,
              max,
            })}
          </p>
        ) : (
          <p
            className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700"
            aria-live="polite"
          >
            {fillTemplate(labels.publicationsCount, {
              count: selected.length,
            })}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          <h3 className="text-sm font-semibold text-zinc-800">
            {labels.selectedForHomepage}
          </h3>
          {selected.length === 0 ? (
            <EmptyState title={emptySelectedText} />
          ) : (
            <ul
              className="flex flex-col gap-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDropList}
            >
              {selected.map((item, index) => (
                <li key={item.id} className="relative">
                  {dropIndex === index && dragId ? (
                    <div
                      className="absolute inset-x-0 -top-1 z-10 h-0.5 rounded bg-[var(--brand-blue)]"
                      aria-hidden
                    />
                  ) : null}
                  <div
                    draggable={!pending}
                    onDragStart={() => onDragStart(item.id)}
                    onDragOver={(e) => onDragOverCard(e, index)}
                    onDragEnd={onDragEnd}
                    className={cn(
                      "flex gap-3 rounded-lg border border-[var(--admin-border)] bg-white p-3",
                      dragId === item.id &&
                        "opacity-50 ring-2 ring-[var(--brand-blue)]",
                    )}
                  >
                    <span
                      className="mt-1 flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded text-zinc-400 active:cursor-grabbing"
                      aria-label={labels.dragHandle}
                      title={labels.dragHandle}
                    >
                      <DragHandleIcon />
                    </span>

                    <span
                      className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700"
                      aria-label={fillTemplate(labels.position, {
                        n: index + 1,
                      })}
                    >
                      {index + 1}
                    </span>

                    <Thumb
                      url={item.mainImageUrl}
                      missingLabel={labels.missingImage}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {kind === "publications" && index === 0 ? (
                          <span className="rounded bg-[var(--admin-accent-soft)] px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--brand-blue)]">
                            {labels.firstSlide}
                          </span>
                        ) : null}
                        <p className="min-w-0 break-words text-sm font-semibold text-zinc-900">
                          {item.title}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-[var(--admin-muted)]">
                        {kind === "publications" ? (
                          <>
                            {categoryLabel(item.category, categoryLabels)}
                            {item.category ? " · " : null}
                            {formatDate(item.publishedAt, locale)}
                          </>
                        ) : (
                          formatDate(item.eventDate, locale)
                        )}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-9 px-2.5 text-xs"
                          disabled={pending || index === 0}
                          onClick={() => move(index, -1)}
                        >
                          {labels.moveUp}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-9 px-2.5 text-xs"
                          disabled={pending || index === selected.length - 1}
                          onClick={() => move(index, 1)}
                        >
                          {labels.moveDown}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="min-h-9 px-2.5 text-xs text-red-700 hover:bg-red-50"
                          disabled={pending}
                          onClick={() => removeItem(item)}
                        >
                          {labels.removeFromHomepage}
                        </Button>
                      </div>
                    </div>
                  </div>
                  {dropIndex === selected.length &&
                  index === selected.length - 1 &&
                  dragId ? (
                    <div
                      className="absolute inset-x-0 -bottom-1 z-10 h-0.5 rounded bg-[var(--brand-blue)]"
                      aria-hidden
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <h3 className="text-sm font-semibold text-zinc-800">
            {labels.availableToAdd}
          </h3>
          <label className="flex flex-col gap-1.5">
            <span className="sr-only">{searchLabel}</span>
            <input
              type="search"
              className="admin-control w-full"
              placeholder={labels.searchPlaceholder}
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              disabled={catalog.length === 0}
            />
          </label>

          {atMax ? (
            <p
              className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
              role="status"
            >
              {labels.maxEventsReached}
            </p>
          ) : null}

          {availableEmpty ? (
            <div className="flex flex-col gap-3">
              {availableEmpty}
              {catalog.length === 0 ? (
                <Link
                  href={listHref}
                  className="text-sm font-medium text-[var(--brand-blue)] underline-offset-2 hover:underline"
                >
                  {goToListLabel}
                </Link>
              ) : null}
            </div>
          ) : (
            <>
              <ul className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto pe-1">
                {visibleAvailable.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-3 rounded-lg border border-[var(--admin-border)] bg-zinc-50/80 p-2.5"
                  >
                    <Thumb
                      url={item.mainImageUrl}
                      missingLabel={labels.missingImage}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-zinc-900">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--admin-muted)]">
                        {kind === "publications" ? (
                          <>
                            {categoryLabel(item.category, categoryLabels)}
                            {item.category ? " · " : null}
                            {formatDate(item.publishedAt, locale)}
                          </>
                        ) : (
                          formatDate(item.eventDate, locale)
                        )}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="min-h-9 shrink-0 self-center px-2.5 text-xs"
                      disabled={pending || atMax}
                      onClick={() => addItem(item)}
                    >
                      {labels.add}
                    </Button>
                  </li>
                ))}
              </ul>
              {hasMore ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setVisibleCount((n) => n + AVAILABLE_PAGE_SIZE)
                  }
                >
                  {labels.loadMore}
                </Button>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--admin-border)] pt-4">
        <div className="min-w-0 flex-1" aria-live="polite">
          <p
            className={cn(
              "text-sm",
              dirty
                ? "font-medium text-amber-800"
                : feedback === "saved"
                  ? "text-emerald-800"
                  : "text-[var(--admin-muted)]",
            )}
          >
            {statusText}
          </p>
          {successText ? (
            <p className="mt-0.5 text-sm text-emerald-800">{successText}</p>
          ) : null}
          {error ? (
            <p className="mt-0.5 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {dirty ? (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={reset}
            >
              {labels.resetChanges}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="brand"
            disabled={!dirty || pending}
            onClick={save}
          >
            {pending ? labels.saving : saveLabel}
          </Button>
        </div>
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>
    </section>
  );
}

export function HomepageSelection({
  locale,
  labels,
  categoryLabels,
  publications: initialPublications,
  events: initialEvents,
  initialLoadError = false,
}: Props) {
  const [pubDirty, setPubDirty] = useState(false);
  const [eventDirty, setEventDirty] = useState(false);
  const [publications, setPublications] = useState(initialPublications);
  const [events, setEvents] = useState(initialEvents);
  const [loadError, setLoadError] = useState(initialLoadError);
  const [reloadKey, setReloadKey] = useState(0);
  const [reloading, startReload] = useTransition();
  const anyDirty = pubDirty || eventDirty;

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!anyDirty) return;
      e.preventDefault();
      e.returnValue = labels.unsavedWarning;
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [anyDirty, labels.unsavedWarning]);

  const onPubDirty = useCallback((d: boolean) => setPubDirty(d), []);
  const onEventDirty = useCallback((d: boolean) => setEventDirty(d), []);

  function retryLoad() {
    startReload(async () => {
      const result = await adminJson<{
        publications: SectionState;
        events: SectionState;
      }>("/api/admin/homepage");
      if (!result.ok) {
        setLoadError(true);
        return;
      }
      setPublications(result.data.publications);
      setEvents(result.data.events);
      setLoadError(false);
      setReloadKey((k) => k + 1);
      setPubDirty(false);
      setEventDirty(false);
    });
  }

  if (loadError) {
    return (
      <div
        className="admin-panel flex flex-col items-start gap-3 p-5"
        role="alert"
      >
        <p className="font-medium text-red-800">{labels.loadFailed}</p>
        <Button
          type="button"
          variant="brand"
          disabled={reloading}
          onClick={retryLoad}
        >
          {labels.retry}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-white px-3.5 text-sm font-medium text-[var(--brand-blue)] hover:bg-zinc-50"
        >
          {labels.viewHomepage}
          <span aria-hidden>↗</span>
        </a>
        <p className="text-sm text-[var(--admin-muted)]">
          {labels.viewHomepageHint}
        </p>
      </div>

      <SelectionPanel
        key={`pubs-${reloadKey}`}
        kind="publications"
        locale={locale}
        labels={labels}
        categoryLabels={categoryLabels}
        initialSelected={publications.selected}
        catalog={publications.available}
        listHref="/admin/publications"
        saveLabel={labels.savePublications}
        savePayload={(ids) => ({ publicationIds: ids })}
        emptySelectedText={labels.emptySelectedPublications}
        emptyNoPublishedText={labels.emptyNoPublishedPublications}
        allSelectedText={labels.allPublicationsSelected}
        goToListLabel={labels.goToPublications}
        searchLabel={labels.searchPublications}
        savedMessage={labels.savedPublications}
        savedEmptyMessage={labels.savedPublicationsEmpty}
        onDirtyChange={onPubDirty}
      />

      <SelectionPanel
        key={`events-${reloadKey}`}
        kind="events"
        locale={locale}
        labels={labels}
        categoryLabels={categoryLabels}
        initialSelected={events.selected}
        catalog={events.available}
        max={events.max ?? 3}
        listHref="/admin/events"
        saveLabel={labels.saveEvents}
        savePayload={(ids) => ({ eventIds: ids })}
        emptySelectedText={labels.emptySelectedEvents}
        emptyNoPublishedText={labels.emptyNoPublishedEvents}
        allSelectedText={labels.allEventsSelected}
        goToListLabel={labels.goToEvents}
        searchLabel={labels.searchEvents}
        savedMessage={labels.savedEvents}
        savedEmptyMessage={labels.savedEventsEmpty}
        onDirtyChange={onEventDirty}
      />
    </div>
  );
}
