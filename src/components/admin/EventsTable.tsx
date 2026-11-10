"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminOverflowMenu } from "@/components/admin/AdminOverflowMenu";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { adminJson } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { AdminEventListItem } from "@/types/event";
import type { PaginatedResult } from "@/types/api";

type Props = {
  locale: Locale;
  labels: Dictionary["admin"]["evt"];
  shared: Dictionary["shared"];
  initial: PaginatedResult<AdminEventListItem>;
};

function formatDate(iso: string | null, locale: Locale): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function EventsTable({ locale, labels, shared, initial }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminEventListItem | null>(
    null,
  );
  const requestGen = useRef(0);

  const data = initial;
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const createdFrom = searchParams.get("createdFrom") ?? "";
  const createdTo = searchParams.get("createdTo") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const [searchDraft, setSearchDraft] = useState(q);

  const hasFilters = Boolean(q || status || createdFrom || createdTo);

  const pushFilters = useCallback(
    (next: Record<string, string>, opts?: { keepPage?: boolean }) => {
      const merged = {
        q,
        status,
        createdFrom,
        createdTo,
        ...next,
      };
      const from = merged.createdFrom;
      const to = merged.createdTo;
      if (from && to && from > to) {
        setRangeError(labels.invalidDateRange);
        return;
      }
      setRangeError(null);

      const gen = ++requestGen.current;
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(next)) {
        if (!value) params.delete(key);
        else params.set(key, value);
      }
      if (!opts?.keepPage && !("page" in next)) params.delete("page");
      startTransition(() => {
        if (gen !== requestGen.current) return;
        router.push(`/admin/events?${params.toString()}`);
      });
    },
    [
      createdFrom,
      createdTo,
      labels.invalidDateRange,
      q,
      router,
      searchParams,
      status,
    ],
  );

  useEffect(() => {
    if (searchDraft === q) return;
    const handle = window.setTimeout(() => {
      pushFilters({ q: searchDraft.trim() });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchDraft, q, pushFilters]);

  function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    startTransition(async () => {
      const result = await adminJson<{ ok: boolean }>(
        `/api/admin/events/${id}`,
        { method: "DELETE" },
      );
      if (!result.ok) {
        setError(labels.errorGeneric);
        return;
      }
      setError(null);
      router.refresh();
    });
  }

  const resultSummary = useMemo(
    () => labels.resultsCount.replace("{count}", String(data.pagination.total)),
    [data.pagination.total, labels.resultsCount],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="admin-panel p-4 sm:p-5">
        <p className="mb-3 text-xs leading-relaxed text-[var(--admin-muted)]">
          {labels.filterCreatedHint}
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="relative min-w-0 flex-1">
            <label
              className="mb-1.5 block text-xs font-medium text-zinc-600"
              htmlFor="evt-q"
            >
              {labels.searchLabel}
            </label>
            <div className="relative">
              <span
                className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-zinc-400"
                aria-hidden
              >
                <svg viewBox="0 0 20 20" className="size-4" fill="none">
                  <circle
                    cx="8.5"
                    cy="8.5"
                    r="5.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="m13 13 3.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <input
                id="evt-q"
                className="admin-control w-full pe-10 ps-9"
                value={searchDraft}
                placeholder={labels.searchPlaceholder}
                onChange={(e) => setSearchDraft(e.target.value)}
              />
              {searchDraft ? (
                <button
                  type="button"
                  className="absolute inset-y-0 end-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100"
                  aria-label={labels.clearSearch}
                  onClick={() => {
                    setSearchDraft("");
                    pushFilters({ q: "" });
                  }}
                >
                  ×
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            <div className="min-w-[9rem]">
              <label
                className="mb-1.5 block text-xs font-medium text-zinc-600"
                htmlFor="evt-status"
              >
                {labels.filterStatus}
              </label>
              <select
                id="evt-status"
                className="admin-control w-full"
                value={status}
                onChange={(e) => pushFilters({ status: e.target.value })}
              >
                <option value="">{labels.filterAll}</option>
                <option value="DRAFT">{labels.statusDraft}</option>
                <option value="PUBLISHED">{labels.statusPublished}</option>
              </select>
            </div>
            <div className="min-w-[10rem]">
              <label
                className="mb-1.5 block text-xs font-medium text-zinc-600"
                htmlFor="evt-from"
              >
                {labels.filterCreatedFrom}
              </label>
              <input
                id="evt-from"
                type="date"
                className="admin-control w-full"
                value={createdFrom}
                onChange={(e) => pushFilters({ createdFrom: e.target.value })}
              />
            </div>
            <div className="min-w-[10rem]">
              <label
                className="mb-1.5 block text-xs font-medium text-zinc-600"
                htmlFor="evt-to"
              >
                {labels.filterCreatedTo}
              </label>
              <input
                id="evt-to"
                type="date"
                className="admin-control w-full"
                value={createdTo}
                onChange={(e) => pushFilters({ createdTo: e.target.value })}
              />
            </div>
          </div>

          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              className="shrink-0"
              onClick={() => {
                setSearchDraft("");
                setRangeError(null);
                pushFilters({
                  q: "",
                  status: "",
                  createdFrom: "",
                  createdTo: "",
                });
              }}
            >
              {labels.clearFilters}
            </Button>
          ) : null}
        </div>

        {rangeError ? (
          <p className="mt-2 text-sm text-red-700" role="alert">
            {rangeError}
          </p>
        ) : null}

        <p className="mt-3 text-sm text-[var(--admin-muted)]" aria-live="polite">
          {resultSummary}
          {pending ? ` · ${labels.updating}` : null}
        </p>

        {error ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            <p>{error}</p>
            <Button
              type="button"
              variant="secondary"
              className="min-h-9"
              onClick={() => {
                setError(null);
                router.refresh();
              }}
            >
              {shared.retry}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="admin-panel hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] border-collapse text-start text-sm">
            <thead>
              <tr className="border-b border-[var(--admin-border)] bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3 font-semibold">{labels.colEvent}</th>
                <th className="px-3 py-3 font-semibold">{labels.colEventDate}</th>
                <th className="px-3 py-3 font-semibold">{labels.colCreated}</th>
                <th className="px-3 py-3 font-semibold">{labels.colStatus}</th>
                <th className="px-3 py-3 font-semibold">{labels.colFeatured}</th>
                <th className="px-4 py-3 font-semibold">{labels.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10">
                    <EmptyState
                      title={hasFilters ? labels.emptyFiltered : labels.empty}
                      description={
                        hasFilters ? labels.emptyFilteredBody : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <EventRow
                    key={item.id}
                    item={item}
                    locale={locale}
                    labels={labels}
                    pending={pending}
                    onDelete={() => setDeleteTarget(item)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {data.items.length === 0 ? (
          <div className="admin-panel p-6">
            <EmptyState
              title={hasFilters ? labels.emptyFiltered : labels.empty}
              description={hasFilters ? labels.emptyFilteredBody : undefined}
            />
          </div>
        ) : (
          data.items.map((item) => (
            <EventCard
              key={item.id}
              item={item}
              locale={locale}
              labels={labels}
              pending={pending}
              onDelete={() => setDeleteTarget(item)}
            />
          ))
        )}
      </div>

      {data.pagination.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3 text-sm">
          <Button
            type="button"
            variant="secondary"
            disabled={page <= 1 || pending}
            onClick={() =>
              pushFilters({ page: String(page - 1) }, { keepPage: true })
            }
          >
            {shared.previous}
          </Button>
          <span className="text-zinc-600">
            {shared.pageOf
              .replace("{page}", String(data.pagination.page))
              .replace("{totalPages}", String(data.pagination.totalPages))}
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={page >= data.pagination.totalPages || pending}
            onClick={() =>
              pushFilters({ page: String(page + 1) }, { keepPage: true })
            }
          >
            {shared.next}
          </Button>
        </div>
      ) : null}

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title={labels.deleteConfirmTitle}
        body={labels.deleteConfirmBody.replace(
          "{title}",
          deleteTarget?.title || deleteTarget?.slug || "",
        )}
        confirmLabel={labels.deleteConfirm}
        cancelLabel={labels.cancel}
        danger
        pending={pending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function StatusBadge({
  status,
  labels,
}: {
  status: AdminEventListItem["status"];
  labels: Dictionary["admin"]["evt"];
}) {
  const published = status === "PUBLISHED";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        published
          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
          : "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
      )}
    >
      {published ? labels.statusPublished : labels.statusDraft}
    </span>
  );
}

function FeaturedBadge({
  featured,
  labels,
}: {
  featured: boolean;
  labels: Dictionary["admin"]["evt"];
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        featured
          ? "bg-[var(--admin-accent-soft)] text-[var(--brand-blue)]"
          : "bg-zinc-100 text-zinc-600",
      )}
    >
      {featured ? labels.featuredYes : labels.featuredNo}
    </span>
  );
}

function Thumb({ url }: { url: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="h-14 w-20 shrink-0 rounded-lg object-cover ring-1 ring-zinc-200"
      />
    );
  }
  return (
    <div
      className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[10px] font-medium uppercase tracking-wide text-zinc-400 ring-1 ring-zinc-200"
      aria-hidden
    >
      —
    </div>
  );
}

function EventRow({
  item,
  locale,
  labels,
  pending,
  onDelete,
}: {
  item: AdminEventListItem;
  locale: Locale;
  labels: Dictionary["admin"]["evt"];
  pending: boolean;
  onDelete: () => void;
}) {
  const title = item.title || item.slug;
  const overflow = [
    ...(item.status === "PUBLISHED"
      ? [
          {
            id: "view",
            label: labels.view,
            onSelect: () => {
              window.open(`/events/${item.slug}`, "_blank", "noopener,noreferrer");
            },
          },
        ]
      : []),
    {
      id: "delete",
      label: labels.delete,
      danger: true,
      disabled: pending,
      onSelect: onDelete,
    },
  ];

  return (
    <tr className="border-b border-zinc-100 transition-colors hover:bg-zinc-50/70">
      <td className="px-4 py-3">
        <div className="flex items-start gap-3">
          <Thumb url={item.mainImageUrl} />
          <p className="font-medium text-balance break-words text-zinc-900">
            {title}
          </p>
        </div>
      </td>
      <td className="px-3 py-3 text-zinc-700">
        {formatDate(item.eventDate, locale)}
      </td>
      <td className="px-3 py-3 text-xs text-zinc-500">
        {formatDate(item.createdAt, locale)}
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={item.status} labels={labels} />
      </td>
      <td className="px-3 py-3">
        <FeaturedBadge featured={item.isFeatured} labels={labels} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/events/${item.id}/edit`}
            className="inline-flex min-h-9 items-center rounded-lg border border-[var(--brand-blue)] bg-[var(--admin-accent-soft)] px-3 text-sm font-medium text-[var(--brand-blue)] hover:bg-[color-mix(in_srgb,var(--brand-blue)_18%,white)]"
          >
            {labels.edit}
          </Link>
          <AdminOverflowMenu label={labels.moreActions} actions={overflow} />
        </div>
      </td>
    </tr>
  );
}

function EventCard({
  item,
  locale,
  labels,
  pending,
  onDelete,
}: {
  item: AdminEventListItem;
  locale: Locale;
  labels: Dictionary["admin"]["evt"];
  pending: boolean;
  onDelete: () => void;
}) {
  const title = item.title || item.slug;
  const overflow = [
    ...(item.status === "PUBLISHED"
      ? [
          {
            id: "view",
            label: labels.view,
            onSelect: () => {
              window.open(`/events/${item.slug}`, "_blank", "noopener,noreferrer");
            },
          },
        ]
      : []),
    {
      id: "delete",
      label: labels.delete,
      danger: true,
      disabled: pending,
      onSelect: onDelete,
    },
  ];

  return (
    <article className="admin-panel p-4">
      <div className="flex gap-3">
        <Thumb url={item.mainImageUrl} />
        <div className="min-w-0 flex-1">
          <h2 className="font-medium text-balance break-words text-zinc-900">
            {title}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={item.status} labels={labels} />
            <FeaturedBadge featured={item.isFeatured} labels={labels} />
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-600">
            <div>
              <dt className="text-zinc-400">{labels.colEventDate}</dt>
              <dd>{formatDate(item.eventDate, locale)}</dd>
            </div>
            <div>
              <dt className="text-zinc-400">{labels.colCreated}</dt>
              <dd>{formatDate(item.createdAt, locale)}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3">
        <Link
          href={`/admin/events/${item.id}/edit`}
          className="inline-flex min-h-9 items-center rounded-lg border border-[var(--brand-blue)] bg-[var(--admin-accent-soft)] px-3 text-sm font-medium text-[var(--brand-blue)]"
        >
          {labels.edit}
        </Link>
        <AdminOverflowMenu label={labels.moreActions} actions={overflow} />
      </div>
    </article>
  );
}
