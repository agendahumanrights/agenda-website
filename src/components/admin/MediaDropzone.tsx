"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  id: string;
  accept: string;
  disabled?: boolean;
  hint: string;
  dropHint: string;
  error?: string | null;
  /** Prefer for single-file surfaces (main image, PDF, founder portrait). */
  onFile?: (file: File) => void | Promise<void>;
  /** Prefer for gallery uploads; receives all selected/dropped files. */
  onFiles?: (files: File[]) => void | Promise<void>;
  multiple?: boolean;
  children?: React.ReactNode;
  className?: string;
};

export function MediaDropzone({
  id,
  accept,
  disabled,
  hint,
  dropHint,
  error,
  onFile,
  onFiles,
  multiple = false,
  children,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length || disabled) return;
    const list = Array.from(files);
    if (onFiles) {
      await onFiles(multiple ? list : list.slice(0, 1));
      return;
    }
    if (onFile) {
      await onFile(list[0]!);
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        className={cn(
          "rounded-xl border-2 border-dashed px-4 py-5 transition-colors",
          dragging
            ? "border-[var(--brand-blue)] bg-[var(--admin-accent-soft)]"
            : "border-[var(--admin-border)] bg-zinc-50/80 hover:border-zinc-300",
          disabled && "pointer-events-none opacity-50",
        )}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
      >
        {children}
        <p className="text-center text-sm font-medium text-zinc-700">
          {dropHint}
        </p>
        <p id={`${id}-hint`} className="mt-1 text-center text-xs text-zinc-500">
          {hint}
        </p>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
