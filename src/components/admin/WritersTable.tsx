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
import { sitePath } from "@/i18n/pathnames";
import type { AdminWriterListItem } from "@/types/writer";
import type { PaginatedResult } from "@/types/api";

type Labels = Dictionary["admin"]["writer"];

type Props = {
  locale: Locale;
  labels: Labels;
  shared: Dictionary["shared"];
  initial: PaginatedResult<AdminWriterListItem>;
};

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

export function WritersTable({
  locale,
  labels,
  shared,
  initial,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<AdminWriterListItem | null>(null);
  const [blocked, setBlocked] = useState<{
    name: string;
    count: number;
  } | null>(null);
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
        router.push(`/admin/writers?${params.toString()}`);
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
    const name = deleteTarget.fullName || deleteTarget.slug;
    const count = deleteTarget.publicationCount;
    setDeleteTarget(null);
    startTransition(async () => {
      const result = await adminJson<{ ok?: boolean }>(
        `/api/admin/writers/${id}`,
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

  function openPublicProfile(slug: string) {
    const path = sitePath(`/writers/${slug}`, locale);
    window.open(path, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="admin-panel p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="relative min-w-0 flex-1">
            <label
              className="mb-1.5 block text-xs font-medium text-zinc-600"
              htmlFor="writer-q"
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
                id="writer-q"
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
        </div>

        <p
          className="mt-3 text-sm text-[var(--admin-muted)]"
          aria-live="polite"
        >
          {resultSummary}
          {pending ? ` · ${labels.updating}` : null}
        </p>

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

      <div className="admin-panel hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-start text-sm">
            <thead>
              <tr className="border-b border-[var(--admin-border)] bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3 font-semibold">{labels.colWriter}</th>
                <th className="px-3 py-3 font-semibold">{labels.colMajor}</th>
                <th className="px-3 py-3 font-semibold">{labels.colEmail}</th>
                <th className="px-3 py-3 font-semibold">
                  {labels.colPublications}
                </th>
                <th className="px-4 py-3 font-semibold">{labels.colActions}</th>
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
                  <WriterRow
                    key={item.id}
                    item={item}
                    labels={labels}
                    locale={locale}
                    pending={pending}
                    onDelete={() => setDeleteTarget(item)}
                    onViewPublic={() => openPublicProfile(item.slug)}
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
              description={
                hasFilters ? labels.emptyFilteredBody : undefined
              }
            />
          </div>
        ) : (
          data.items.map((item) => (
            <WriterCard
              key={item.id}
              item={item}
              labels={labels}
              locale={locale}
              pending={pending}
              onDelete={() => setDeleteTarget(item)}
              onViewPublic={() => openPublicProfile(item.slug)}
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

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title={labels.deleteConfirmTitle}
        body={
          deleteTarget
            ? labels.deleteConfirmBody
                .replace(
                  "{name}",
                  deleteTarget.fullName || deleteTarget.slug,
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

function WriterRow({
  item,
  labels,
  locale,
  pending,
  onDelete,
  onViewPublic,
}: {
  item: AdminWriterListItem;
  labels: Labels;
  locale: Locale;
  pending: boolean;
  onDelete: () => void;
  onViewPublic: () => void;
}) {
  void locale;
  const name = item.fullName || item.slug;

  return (
    <tr className="border-b border-[var(--admin-border)] last:border-0 hover:bg-zinc-50/80">
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Portrait url={item.profileImageUrl} missingLabel={labels.missingPortrait} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-zinc-900">{name}</p>
          </div>
        </div>
      </td>
      <td className="max-w-[16rem] px-3 py-3">
        <span className="block truncate text-zinc-700">
          {item.major || "—"}
        </span>
      </td>
      <td className="max-w-[14rem] px-3 py-3">
        <span className="block truncate text-zinc-700" dir="ltr">
          {item.email || "—"}
        </span>
      </td>
      <td className="px-3 py-3 tabular-nums text-zinc-700">
        {item.publicationCount}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/writers/${item.id}/edit`}
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
                onSelect: onViewPublic,
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

function WriterCard({
  item,
  labels,
  locale,
  pending,
  onDelete,
  onViewPublic,
}: {
  item: AdminWriterListItem;
  labels: Labels;
  locale: Locale;
  pending: boolean;
  onDelete: () => void;
  onViewPublic: () => void;
}) {
  void locale;
  const name = item.fullName || item.slug;

  return (
    <article className="admin-panel p-4">
      <div className="flex gap-3">
        <Portrait url={item.profileImageUrl} missingLabel={labels.missingPortrait} />
        <div className="min-w-0 flex-1">
          <p className="break-words font-semibold text-zinc-900">{name}</p>
          <p className="mt-0.5 text-sm text-[var(--admin-muted)]">
            {item.major || "—"}
          </p>
          <p className="mt-1 truncate text-sm text-zinc-700" dir="ltr">
            {item.email || "—"}
          </p>
          <dl className="mt-2 text-xs text-[var(--admin-muted)]">
            <div>
              <dt className="font-medium">{labels.colPublications}</dt>
              <dd className="text-zinc-800">{item.publicationCount}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--admin-border)] pt-3">
        <Link
          href={`/admin/writers/${item.id}/edit`}
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
              onSelect: onViewPublic,
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