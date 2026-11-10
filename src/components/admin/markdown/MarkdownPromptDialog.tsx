"use client";

import { useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type Field = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
};

type Props = {
  open: boolean;
  title: string;
  fields: Field[];
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function MarkdownPromptDialog({
  open,
  title,
  fields,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: Props) {
  const titleId = useId();
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => firstRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-4 shadow-xl"
      >
        <h3 id={titleId} className="text-base font-semibold text-zinc-900">
          {title}
        </h3>
        <div className="mt-4 flex flex-col gap-3">
          {fields.map((field, index) => (
            <label key={field.id} className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-700">{field.label}</span>
              <Input
                ref={index === 0 ? firstRef : undefined}
                id={field.id}
                value={field.value}
                placeholder={field.placeholder}
                onChange={(e) => field.onChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onConfirm();
                  }
                }}
              />
              {field.hint ? (
                <span className="text-xs text-zinc-500">{field.hint}</span>
              ) : null}
            </label>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Tiny helper so callers can share the same surface styles if needed. */
export function markdownDialogPanelClassName(className?: string) {
  return cn("rounded-lg border border-zinc-200 bg-white p-4 shadow-xl", className);
}
