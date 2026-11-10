"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { adminJson } from "@/lib/admin-api";
import type { PublicationCategoryAdmin } from "@/types/publication";

export type AddCategoryModalLabels = {
  title: string;
  description: string;
  nameEn: string;
  nameAr: string;
  nameEnPlaceholder: string;
  nameArPlaceholder: string;
  cancel: string;
  save: string;
  saving: string;
  errorRequired: string;
  errorGeneric: string;
  errorConflict: string;
};

type Props = {
  open: boolean;
  labels: AddCategoryModalLabels;
  onCancel: () => void;
  onCreated: (category: PublicationCategoryAdmin) => void;
};

export function AddCategoryModal({
  open,
  labels,
  onCancel,
  onCreated,
}: Props) {
  const titleId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    nameEn?: string;
    nameAr?: string;
  }>({});

  useEffect(() => {
    if (!open) return;
    setNameEn("");
    setNameAr("");
    setError(null);
    setFieldErrors({});
    setPending(false);
    const t = window.setTimeout(() => firstFieldRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending, onCancel]);

  if (!open) return null;

  async function onSave() {
    const nextErrors: { nameEn?: string; nameAr?: string } = {};
    if (!nameEn.trim()) nextErrors.nameEn = labels.errorRequired;
    if (!nameAr.trim()) nextErrors.nameAr = labels.errorRequired;
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError(labels.errorRequired);
      return;
    }

    setPending(true);
    setError(null);
    const result = await adminJson<{ category: PublicationCategoryAdmin }>(
      "/api/admin/publications/categories",
      {
        method: "POST",
        body: JSON.stringify({
          nameEn: nameEn.trim(),
          nameAr: nameAr.trim(),
        }),
      },
    );
    setPending(false);

    if (!result.ok) {
      if (result.status === 409) setError(labels.errorConflict);
      else if (result.status === 400) {
        setError(result.payload.error?.message || labels.errorGeneric);
      } else setError(labels.errorGeneric);
      return;
    }

    onCreated(result.data.category);
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !pending) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-xl border border-[var(--admin-border)] bg-white p-5 shadow-xl"
      >
        <h2 id={titleId} className="text-lg font-semibold text-zinc-900">
          {labels.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          {labels.description}
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <FormField
            id="category-name-en"
            label={labels.nameEn}
            error={fieldErrors.nameEn}
          >
            <Input
              ref={firstFieldRef}
              id="category-name-en"
              dir="ltr"
              className="admin-control"
              value={nameEn}
              disabled={pending}
              placeholder={labels.nameEnPlaceholder}
              onChange={(e) => setNameEn(e.target.value)}
            />
          </FormField>
          <FormField
            id="category-name-ar"
            label={labels.nameAr}
            error={fieldErrors.nameAr}
          >
            <Input
              id="category-name-ar"
              dir="rtl"
              className="admin-control"
              value={nameAr}
              disabled={pending}
              placeholder={labels.nameArPlaceholder}
              onChange={(e) => setNameAr(e.target.value)}
            />
          </FormField>
          {error ? (
            <p role="alert" className="text-xs text-red-600">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={onCancel}
          >
            {labels.cancel}
          </Button>
          <Button
            type="button"
            variant="brand"
            disabled={pending}
            onClick={() => void onSave()}
          >
            {pending ? labels.saving : labels.save}
          </Button>
        </div>
      </div>
    </div>
  );
}
