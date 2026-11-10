"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import { AddCategoryModal } from "@/components/admin/AddCategoryModal";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { adminJson } from "@/lib/admin-api";
import type { Dictionary } from "@/i18n/dictionaries";
import type { PaginatedResult } from "@/types/api";
import type { PublicationCategoryAdmin } from "@/types/publication";

type Labels = Dictionary["admin"]["pubCategories"];

type Props = {
  labels: Labels;
  shared: Dictionary["shared"];
  initial: PaginatedResult<PublicationCategoryAdmin>;
};

export function CategoriesTable({ labels, shared, initial }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] =
    useState<PublicationCategoryAdmin | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<PublicationCategoryAdmin | null>(null);
  const [editNameEn, setEditNameEn] = useState("");
  const [editNameAr, setEditNameAr] = useState("");
  const requestGen = useRef(0);

  const data = initial;
  const q = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const [searchDraft, setSearchDraft] = useState(q);

  const pushFilters = useCallback(
    (next: Record<string, string>) => {
      const gen = ++requestGen.current;
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(next)) {
        if (!value) params.delete(key);
        else params.set(key, value);
      }
      if (!("page" in next)) params.delete("page");
      startTransition(() => {
        if (gen !== requestGen.current) return;
        router.push(`/admin/publications/categories?${params.toString()}`);
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

  async function onDelete() {
    if (!deleteTarget) return;
    setError(null);
    const result = await adminJson<{ ok: boolean }>(
      `/api/admin/publications/categories/${deleteTarget.id}`,
      { method: "DELETE" },
    );
    setDeleteTarget(null);
    if (!result.ok) {
      setError(result.payload.error?.message || labels.errorGeneric);
      return;
    }
    setMessage(labels.deleted);
    router.refresh();
  }

  async function onSaveEdit() {
    if (!editTarget) return;
    setError(null);
    const result = await adminJson<{ category: PublicationCategoryAdmin }>(
      `/api/admin/publications/categories/${editTarget.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          nameEn: editNameEn.trim(),
          nameAr: editNameAr.trim(),
        }),
      },
    );
    if (!result.ok) {
      if (result.status === 409) setError(labels.errorConflict);
      else setError(result.payload.error?.message || labels.errorGeneric);
      return;
    }
    setEditTarget(null);
    setMessage(labels.updated);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-[16rem] flex-1">
          <label
            htmlFor="cat-search"
            className="mb-1 block text-sm font-medium text-zinc-800"
          >
            {labels.searchLabel}
          </label>
          <Input
            id="cat-search"
            className="admin-control"
            value={searchDraft}
            placeholder={labels.searchPlaceholder}
            onChange={(e) => setSearchDraft(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="brand"
          onClick={() => setAddOpen(true)}
        >
          {labels.add}
        </Button>
      </div>

      {message ? (
        <p
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          role="status"
        >
          {message}
        </p>
      ) : null}
      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {data.items.length === 0 ? (
        <EmptyState
          title={q ? labels.emptyFiltered : labels.empty}
          description={q ? labels.emptyFilteredBody : labels.emptyBody}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--admin-border)] bg-white">
          <table className="min-w-full text-start text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">{labels.colNameEn}</th>
                <th className="px-4 py-3 font-medium">{labels.colNameAr}</th>
                <th className="px-4 py-3 font-medium">{labels.colSlug}</th>
                <th className="px-4 py-3 font-medium">{labels.colCount}</th>
                <th className="px-4 py-3 font-medium">{labels.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-[var(--admin-border)]"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900" dir="ltr">
                    {item.nameEn}
                  </td>
                  <td className="px-4 py-3 text-zinc-800" dir="rtl">
                    {item.nameAr}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600" dir="ltr">
                    {item.slug}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {item.publicationCount}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-9"
                        disabled={pending}
                        onClick={() => {
                          setEditTarget(item);
                          setEditNameEn(item.nameEn);
                          setEditNameAr(item.nameAr);
                          setError(null);
                        }}
                      >
                        {labels.edit}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-9 text-red-700"
                        disabled={pending}
                        onClick={() => {
                          setMessage(null);
                          if (item.publicationCount > 0) {
                            setError(
                              labels.deleteBlockedBody.replace(
                                "{count}",
                                String(item.publicationCount),
                              ),
                            );
                            return;
                          }
                          setError(null);
                          setDeleteTarget(item);
                        }}
                      >
                        {labels.delete}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3 text-sm text-zinc-600">
          <button
            type="button"
            className="disabled:opacity-40"
            disabled={page <= 1 || pending}
            onClick={() => pushFilters({ q, page: String(page - 1) })}
          >
            {shared.previous}
          </button>
          <span>
            {shared.pageOf
              .replace("{page}", String(page))
              .replace("{totalPages}", String(data.pagination.totalPages))}
          </span>
          <button
            type="button"
            className="disabled:opacity-40"
            disabled={page >= data.pagination.totalPages || pending}
            onClick={() => pushFilters({ q, page: String(page + 1) })}
          >
            {shared.next}
          </button>
        </div>
      ) : null}

      <div className="text-sm">
        <Link
          href="/admin/publications"
          className="text-[var(--brand-blue)] underline-offset-2 hover:underline"
        >
          {labels.backToPublications}
        </Link>
      </div>

      <AddCategoryModal
        open={addOpen}
        labels={{
          title: labels.addTitle,
          description: labels.addDescription,
          nameEn: labels.colNameEn,
          nameAr: labels.colNameAr,
          nameEnPlaceholder: labels.nameEnPlaceholder,
          nameArPlaceholder: labels.nameArPlaceholder,
          cancel: labels.cancel,
          save: labels.save,
          saving: labels.saving,
          errorRequired: labels.errorRequired,
          errorGeneric: labels.errorGeneric,
          errorConflict: labels.errorConflict,
        }}
        onCancel={() => setAddOpen(false)}
        onCreated={() => {
          setAddOpen(false);
          setMessage(labels.created);
          router.refresh();
        }}
      />

      {editTarget ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditTarget(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-xl border border-[var(--admin-border)] bg-white p-5 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-zinc-900">
              {labels.editTitle}
            </h2>
            <p className="mt-1 text-xs text-zinc-500" dir="ltr">
              {labels.slugReadonly}: {editTarget.slug}
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-800">
                  {labels.colNameEn}
                </span>
                <Input
                  dir="ltr"
                  className="admin-control"
                  value={editNameEn}
                  onChange={(e) => setEditNameEn(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-800">
                  {labels.colNameAr}
                </span>
                <Input
                  dir="rtl"
                  className="admin-control"
                  value={editNameAr}
                  onChange={(e) => setEditNameAr(e.target.value)}
                />
              </label>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditTarget(null)}
              >
                {labels.cancel}
              </Button>
              <Button
                type="button"
                variant="brand"
                onClick={() => void onSaveEdit()}
              >
                {labels.save}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title={labels.deleteConfirmTitle}
        body={labels.deleteConfirmBody.replace(
          "{name}",
          deleteTarget?.nameEn ?? "",
        )}
        confirmLabel={labels.deleteConfirm}
        cancelLabel={labels.cancel}
        danger
        pending={pending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void onDelete()}
      />
    </div>
  );
}
