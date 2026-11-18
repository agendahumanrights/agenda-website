"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { PaginatedResult } from "@/types/api";
import type {
  AdminNewsletterSubscriberListItem,
  NewsletterSubscriberStatus,
} from "@/types/newsletter";

type Labels = Dictionary["admin"]["newsletterAdmin"];

type Props = {
  locale: Locale;
  labels: Labels;
  shared: Dictionary["shared"];
  initial: PaginatedResult<AdminNewsletterSubscriberListItem>;
};

function formatDate(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function statusLabel(
  status: NewsletterSubscriberStatus,
  labels: Labels,
): string {
  return status === "ACTIVE" ? labels.statusActive : labels.statusUnsubscribed;
}

export function NewsletterSubscribersTable({
  locale,
  labels,
  shared,
  initial,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const requestGen = useRef(0);

  const data = initial;
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const [searchDraft, setSearchDraft] = useState(q);
  const hasFilters = Boolean(q || status);

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
        router.push(`/admin/newsletter?${params.toString()}`);
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

  const resultSummary = useMemo(
    () =>
      labels.resultsCount.replace("{count}", String(data.pagination.total)),
    [data.pagination.total, labels.resultsCount],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="admin-panel p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="relative min-w-0 flex-1">
            <label
              className="mb-1.5 block text-xs font-medium text-zinc-600"
              htmlFor="newsletter-q"
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
                id="newsletter-q"
                className="admin-control w-full pe-10 ps-9"
                value={searchDraft}
                placeholder={labels.searchPlaceholder}
                dir="ltr"
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

          <div className="w-full sm:w-48">
            <label
              className="mb-1.5 block text-xs font-medium text-zinc-600"
              htmlFor="newsletter-status"
            >
              {labels.statusFilter}
            </label>
            <select
              id="newsletter-status"
              className="admin-control w-full"
              value={status}
              onChange={(e) => pushFilters({ status: e.target.value })}
            >
              <option value="">{labels.statusAll}</option>
              <option value="ACTIVE">{labels.statusActive}</option>
              <option value="UNSUBSCRIBED">{labels.statusUnsubscribed}</option>
            </select>
          </div>

          {hasFilters ? (
            <Button
              type="button"
              variant="secondary"
              className="min-h-11"
              onClick={() => {
                setSearchDraft("");
                pushFilters({ q: "", status: "" });
              }}
            >
              {labels.clearFilters}
            </Button>
          ) : null}
        </div>

        <p
          className="mt-3 text-sm text-[var(--admin-muted)]"
          aria-live="polite"
        >
          {resultSummary}
          {pending ? ` · ${labels.updating}` : null}
        </p>
      </div>

      <div className="admin-panel hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-start text-sm">
            <thead>
              <tr className="border-b border-[var(--admin-border)] bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3 font-semibold">{labels.colEmail}</th>
                <th className="px-3 py-3 font-semibold">{labels.colStatus}</th>
                <th className="px-3 py-3 font-semibold">
                  {labels.colSubscribed}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {labels.colNotification}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10">
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
                  <SubscriberRow
                    key={item.id}
                    item={item}
                    labels={labels}
                    locale={locale}
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
            <SubscriberCard
              key={item.id}
              item={item}
              labels={labels}
              locale={locale}
            />
          ))
        )}
      </div>

      {data.pagination.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
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
    </div>
  );
}

function StatusBadge({
  status,
  labels,
}: {
  status: NewsletterSubscriberStatus;
  labels: Labels;
}) {
  const active = status === "ACTIVE";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        active
          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
          : "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200",
      )}
    >
      {statusLabel(status, labels)}
    </span>
  );
}

function SubscriberRow({
  item,
  labels,
  locale,
}: {
  item: AdminNewsletterSubscriberListItem;
  labels: Labels;
  locale: Locale;
}) {
  return (
    <tr className="border-b border-[var(--admin-border)] last:border-0 hover:bg-zinc-50/80">
      <td className="px-4 py-3">
        <span className="block truncate font-medium text-zinc-900" dir="ltr">
          {item.email}
        </span>
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={item.status} labels={labels} />
      </td>
      <td className="px-3 py-3 text-zinc-700">
        {formatDate(item.subscribedAt, locale)}
      </td>
      <td className="px-4 py-3 text-zinc-700">
        {item.notificationSentAt
          ? formatDate(item.notificationSentAt, locale)
          : labels.notificationPending}
      </td>
    </tr>
  );
}

function SubscriberCard({
  item,
  labels,
  locale,
}: {
  item: AdminNewsletterSubscriberListItem;
  labels: Labels;
  locale: Locale;
}) {
  return (
    <article className="admin-panel p-4">
      <p className="break-all font-semibold text-zinc-900" dir="ltr">
        {item.email}
      </p>
      <div className="mt-2">
        <StatusBadge status={item.status} labels={labels} />
      </div>
      <dl className="mt-3 grid gap-2 text-sm text-[var(--admin-muted)]">
        <div>
          <dt className="font-medium">{labels.colSubscribed}</dt>
          <dd className="text-zinc-800">
            {formatDate(item.subscribedAt, locale)}
          </dd>
        </div>
        <div>
          <dt className="font-medium">{labels.colNotification}</dt>
          <dd className="text-zinc-800">
            {item.notificationSentAt
              ? formatDate(item.notificationSentAt, locale)
              : labels.notificationPending}
          </dd>
        </div>
      </dl>
    </article>
  );
}
