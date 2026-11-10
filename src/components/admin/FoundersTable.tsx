"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type DragEvent,
} from "react";

import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminOverflowMenu } from "@/components/admin/AdminOverflowMenu";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { adminJson } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { AdminFounderListItem } from "@/types/founder";
import type { PaginatedResult } from "@/types/api";

type Labels = Dictionary["admin"]["founder"];

type Props = {
  locale: Locale;
  labels: Labels;
  shared: Dictionary["shared"];
  initial: PaginatedResult<AdminFounderListItem>;
  /** Complete ordered list (unfiltered) for reorder dialog. */
  orderInitial: AdminFounderListItem[];
};

function idsEqual(a: AdminFounderListItem[], b: AdminFounderListItem[]) {
  if (a.length !== b.length) return false;
  return a.every((item, i) => item.id === b[i]?.id);
}

function Portrait({
  url,
  missingLabel,
  size = "md",
}: {
  url: string | null;
  missingLabel: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-10 w-10" : "h-11 w-11";
  if (!url) {
    return (
      <div
        className={cn(
          dim,
          "flex shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[0.6rem] font-medium text-zinc-500",
        )}
        aria-hidden
      >
        {missingLabel}
      </div>
    );
  }
  return (
    <div className={cn(dim, "shrink-0 overflow-hidden rounded-full bg-zinc-100")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
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

export function FoundersTable({
  locale,
  labels,
  shared,
  initial,
  orderInitial,
}: Props) {
  void locale;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<AdminFounderListItem | null>(null);
  const [blocked, setBlocked] = useState<{
    name: string;
    count: number;
  } | null>(null);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [reorderSession, setReorderSession] = useState(0);
  const requestGen = useRef(0);

  const data = initial;
  const q = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const [searchDraft, setSearchDraft] = useState(q);
  const hasFilters = Boolean(q);

  const pushFilters = useCallback(
    (next: Record<string, string>, opts?: { keepPage?: boolean }) => {
      const gen = ++requestGen.current;
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(next)) {
        if (!value) params.delete(key);
        else params.set(key, value);
      }
      if (!opts?.keepPage && !("page" in next)) params.delete("page");
      startTransition(() => {
        if (gen !== requestGen.current) return;
        router.push(`/admin/founders?${params.toString()}`);
      });
    },
    [router, searchParams],
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
    const name = deleteTarget.fullName || deleteTarget.bioKey;
    const count = deleteTarget.publicationCount;
    setDeleteTarget(null);
    startTransition(async () => {
      const result = await adminJson<{ ok?: boolean }>(
        `/api/admin/founders/${id}`,
        { method: "DELETE" },
      );
      if (!result.ok) {
        if (result.status === 409) {
          const details = result.payload.error?.details as
            | { publicationCount?: number }
            | undefined;
          setBlocked({
            name,
            count: details?.publicationCount ?? count,
          });
          return;
        }
        setError(labels.errorGeneric);
        return;
      }
      setMessage(labels.successDeleted);
      setError(null);
      router.refresh();
    });
  }

  const resultSummary = useMemo(
    () =>
      labels.resultsCount.replace(
        "{count}",
        String(data.pagination.total),
      ),
    [data.pagination.total, labels.resultsCount],
  );

  const canReorder = orderInitial.length >= 2;

  return (
    <div className="flex flex-col gap-4">
      <div className="admin-panel p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="relative min-w-0 flex-1">
            <label
              className="mb-1.5 block text-xs font-medium text-zinc-600"
              htmlFor="founder-q"
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
                id="founder-q"
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

          <Button
            type="button"
            variant="secondary"
            className="shrink-0"
            disabled={!canReorder}
            title={!canReorder ? labels.reorderDisabled : undefined}
            onClick={() => {
              setReorderSession((n) => n + 1);
              setReorderOpen(true);
            }}
          >
            {labels.reorder}
          </Button>
        </div>

        <p
          className="mt-3 text-sm text-[var(--admin-muted)]"
          aria-live="polite"
        >
          {resultSummary}
          {pending ? ` · ${labels.updating}` : null}
        </p>
        {!canReorder && orderInitial.length > 0 ? (
          <p className="mt-1 text-xs text-[var(--admin-muted)]">
            {labels.reorderDisabled}
          </p>
        ) : null}

        {message ? (
          <p
            className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
            role="status"
          >
            {message}
          </p>
        ) : null}

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

      {/* Desktop table */}
      <div className="admin-panel hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] border-collapse text-start text-sm">
            <thead>
              <tr className="border-b border-[var(--admin-border)] bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3 font-semibold">
                  {labels.colFounder}
                </th>
                <th className="px-3 py-3 font-semibold">{labels.colEmail}</th>
                <th className="px-3 py-3 font-semibold">
                  {labels.colPublications}
                </th>
                <th className="px-3 py-3 font-semibold">
                  {labels.colPosition}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {labels.colActions}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10">
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
                  <FounderRow
                    key={item.id}
                    item={item}
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

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {data.items.length === 0 ? (
          <div className="admin-panel p-6">
            <EmptyState
              title={hasFilters ? labels.emptyFiltered : labels.empty}
              description={
                hasFilters ? labels.emptyFilteredBody : undefined
              }
            />
          </div>
        ) : (
          data.items.map((item) => (
            <FounderCard
              key={item.id}
              item={item}
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
          <span className="text-[var(--admin-muted)]">
            {shared.pageOf
              .replace("{page}", String(data.pagination.page))
              .replace(
                "{totalPages}",
                String(data.pagination.totalPages),
              )}
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

      {reorderOpen ? (
        <ReorderDialog
          key={reorderSession}
          labels={labels}
          orderInitial={orderInitial}
          onClose={() => setReorderOpen(false)}
          onSaved={() => {
            setMessage(labels.successReordered);
            setError(null);
            setReorderOpen(false);
            router.refresh();
          }}
        />
      ) : null}

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title={labels.deleteConfirmTitle}
        body={
          deleteTarget
            ? labels.deleteConfirmBody
                .replace(
                  "{name}",
                  deleteTarget.fullName || deleteTarget.bioKey,
                )
                .replace(
                  "{count}",
                  String(deleteTarget.publicationCount),
                )
            : ""
        }
        confirmLabel={labels.deleteConfirm}
        cancelLabel={labels.cancel}
        danger
        pending={pending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <AdminConfirmDialog
        open={Boolean(blocked)}
        title={labels.deleteBlockedTitle}
        body={
          blocked
            ? labels.deleteBlockedBody.replace(
                "{count}",
                String(blocked.count),
              )
            : ""
        }
        confirmLabel={labels.cancel}
        cancelLabel={labels.cancel}
        onConfirm={() => setBlocked(null)}
        onCancel={() => setBlocked(null)}
      />
    </div>
  );
}

function FounderRow({
  item,
  labels,
  pending,
  onDelete,
}: {
  item: AdminFounderListItem;
  labels: Labels;
  pending: boolean;
  onDelete: () => void;
}) {
  const name = item.fullName || item.bioKey;
  const position = item.sortOrder + 1;

  return (
    <tr className="border-b border-[var(--admin-border)] last:border-0 hover:bg-zinc-50/80">
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Portrait url={item.profileImageUrl} missingLabel={labels.missingPortrait} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-zinc-900">{name}</p>
            <p className="truncate text-xs text-[var(--admin-muted)]">
              {item.professionalArea || "—"}
            </p>
          </div>
        </div>
      </td>
      <td className="max-w-[14rem] px-3 py-3">
        <span className="block truncate text-zinc-700" dir="ltr">
          {item.email || "—"}
        </span>
      </td>
      <td className="px-3 py-3 tabular-nums text-zinc-700">
        {item.publicationCount}
      </td>
      <td className="px-3 py-3 tabular-nums text-zinc-700">
        {labels.positionN.replace("{n}", String(position))}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/founders/${item.id}/edit`}
            className="inline-flex min-h-9 items-center rounded-lg border border-[var(--brand-blue)]/30 bg-[var(--admin-accent-soft)] px-3 text-sm font-medium text-[var(--brand-blue)] hover:bg-[color-mix(in_srgb,var(--brand-blue)_18%,white)]"
          >
            {labels.edit}
          </Link>
          <AdminOverflowMenu
            label={labels.moreActions}
            actions={[
              {
                id: "view",
                label: labels.viewPublic,
                onSelect: () => {
                  window.open(
                    `/about#founder-${item.bioKey}`,
                    "_blank",
                    "noopener,noreferrer",
                  );
                },
              },
              {
                id: "delete",
                label: labels.delete,
                danger: true,
                disabled: pending,
                onSelect: onDelete,
              },
            ]}
          />
        </div>
      </td>
    </tr>
  );
}

function FounderCard({
  item,
  labels,
  pending,
  onDelete,
}: {
  item: AdminFounderListItem;
  labels: Labels;
  pending: boolean;
  onDelete: () => void;
}) {
  const name = item.fullName || item.bioKey;
  const position = item.sortOrder + 1;

  return (
    <article className="admin-panel p-4">
      <div className="flex gap-3">
        <Portrait url={item.profileImageUrl} missingLabel={labels.missingPortrait} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-900 break-words">{name}</p>
          <p className="mt-0.5 text-sm text-[var(--admin-muted)]">
            {item.professionalArea || "—"}
          </p>
          <p className="mt-1 truncate text-sm text-zinc-700" dir="ltr">
            {item.email || "—"}
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-xs text-[var(--admin-muted)]">
            <div>
              <dt className="font-medium">{labels.colPublications}</dt>
              <dd className="text-zinc-800">{item.publicationCount}</dd>
            </div>
            <div>
              <dt className="font-medium">{labels.colPosition}</dt>
              <dd className="text-zinc-800">
                {labels.positionN.replace("{n}", String(position))}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--admin-border)] pt-3">
        <Link
          href={`/admin/founders/${item.id}/edit`}
          className="inline-flex min-h-9 items-center rounded-lg border border-[var(--brand-blue)]/30 bg-[var(--admin-accent-soft)] px-3 text-sm font-medium text-[var(--brand-blue)]"
        >
          {labels.edit}
        </Link>
        <AdminOverflowMenu
          label={labels.moreActions}
          actions={[
            {
              id: "view",
              label: labels.viewPublic,
              onSelect: () => {
                window.open(
                  `/about#founder-${item.bioKey}`,
                  "_blank",
                  "noopener,noreferrer",
                );
              },
            },
            {
              id: "delete",
              label: labels.delete,
              danger: true,
              disabled: pending,
              onSelect: onDelete,
            },
          ]}
        />
      </div>
    </article>
  );
}

function ReorderDialog({
  labels,
  orderInitial,
  onClose,
  onSaved,
}: {
  labels: Labels;
  orderInitial: AdminFounderListItem[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [items, setItems] = useState(orderInitial);
  const [baseline, setBaseline] = useState(orderInitial);
  const [loading, setLoading] = useState(true);
  const [saving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const dirty = !idsEqual(items, baseline);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await adminJson<{ items: AdminFounderListItem[] }>(
        "/api/admin/founders?forOrder=1",
      );
      if (cancelled) return;
      if (!result.ok) {
        setError(labels.errorGeneric);
        setItems(orderInitial);
        setBaseline(orderInitial);
        setLoading(false);
        return;
      }
      setItems(result.data.items);
      setBaseline(result.data.items);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [orderInitial, labels.errorGeneric]);

  useEffect(() => {
    const t = window.setTimeout(() => closeRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  function move(index: number, delta: number) {
    setItems((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
    setError(null);
  }

  function save() {
    if (!dirty || saving) return;
    startSave(async () => {
      const result = await adminJson<{ ok: boolean }>(
        "/api/admin/founders/reorder",
        {
          method: "PUT",
          body: JSON.stringify({
            founderIds: items.map((f) => f.id),
          }),
        },
      );
      if (!result.ok) {
        if (result.status === 409 || result.status === 400) {
          setError(
            result.payload.error?.message || labels.reorderConflict,
          );
        } else {
          setError(result.payload.error?.message || labels.errorGeneric);
        }
        return;
      }
      setBaseline(items);
      onSaved();
    });
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
    setItems((prev) => {
      const from = prev.findIndex((p) => p.id === dragId);
      if (from < 0) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      let to = dropIndex;
      if (from < to) to -= 1;
      to = Math.max(0, Math.min(to, next.length));
      next.splice(to, 0, item);
      return next;
    });
    setError(null);
    setDragId(null);
    setDropIndex(null);
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-stretch justify-center bg-black/40 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex h-full w-full flex-col bg-white shadow-xl sm:h-auto sm:max-h-[min(90dvh,40rem)] sm:max-w-lg sm:rounded-xl sm:border sm:border-[var(--admin-border)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--admin-border)] px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-lg font-semibold text-zinc-900"
            >
              {labels.reorderTitle}
            </h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              {labels.reorderDescription}
            </p>
          </div>
          <Button
            ref={closeRef}
            type="button"
            variant="ghost"
            className="min-h-9 shrink-0 px-2"
            disabled={saving}
            onClick={onClose}
            aria-label={labels.cancel}
          >
            ×
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
          {loading ? (
            <p className="py-8 text-center text-sm text-[var(--admin-muted)]">
              {labels.updating}
            </p>
          ) : (
            <ul
              className="flex flex-col gap-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDropList}
            >
              {items.map((item, index) => (
                <li key={item.id} className="relative">
                  {dropIndex === index && dragId ? (
                    <div
                      className="absolute inset-x-0 -top-1 z-10 h-0.5 rounded bg-[var(--brand-blue)]"
                      aria-hidden
                    />
                  ) : null}
                  <div
                    draggable={!saving}
                    onDragStart={() => setDragId(item.id)}
                    onDragOver={(e) => onDragOverCard(e, index)}
                    onDragEnd={() => {
                      setDragId(null);
                      setDropIndex(null);
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-white p-2.5",
                      dragId === item.id &&
                        "opacity-50 ring-2 ring-[var(--brand-blue)]",
                    )}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded text-zinc-400 active:cursor-grabbing"
                      aria-label={labels.dragHandle}
                      title={labels.dragHandle}
                    >
                      <DragHandleIcon />
                    </span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">
                      {index + 1}
                    </span>
                    <Portrait
                      url={item.profileImageUrl}
                      missingLabel={labels.missingPortrait}
                      size="sm"
                    />
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900">
                      {item.fullName || item.bioKey}
                    </p>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-8 px-2 text-xs"
                        disabled={saving || index === 0}
                        onClick={() => move(index, -1)}
                      >
                        {labels.moveUp}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-8 px-2 text-xs"
                        disabled={saving || index === items.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        {labels.moveDown}
                      </Button>
                    </div>
                  </div>
                  {dropIndex === items.length &&
                  index === items.length - 1 &&
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
          {error ? (
            <p className="mt-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--admin-border)] px-4 py-4 sm:px-5">
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={onClose}
          >
            {labels.cancel}
          </Button>
          <Button
            type="button"
            variant="brand"
            disabled={!dirty || saving || loading}
            onClick={save}
          >
            {saving ? labels.saving : labels.saveOrder}
          </Button>
        </div>
      </div>
    </div>
  );
}
