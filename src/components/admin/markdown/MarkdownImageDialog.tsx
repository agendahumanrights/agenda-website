"use client";

import { useEffect, useId, useRef, useState } from "react";

import { MediaDropzone } from "@/components/admin/MediaDropzone";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import type { AdminMediaRef } from "@/types/publication";

export type MarkdownImageUploadConfig = {
  purpose: "publication-inline" | "event-inline";
  maxImageBytes: number;
};

export type MarkdownImageDialogLabels = {
  title: string;
  alt: string;
  url: string;
  captionOptional: string;
  tabUpload: string;
  tabUrl: string;
  dropHint: string;
  fileHint: string;
  uploading: string;
  uploadFailed: string;
  insert: string;
  cancel: string;
  previewAlt: string;
};

type Props = {
  open: boolean;
  labels: MarkdownImageDialogLabels;
  upload?: MarkdownImageUploadConfig | null;
  initialAlt?: string;
  disabled?: boolean;
  onCancel: () => void;
  onInsert: (input: { url: string; alt: string; title?: string }) => void;
};

type Mode = "upload" | "url";

function formatMaxMb(bytes: number): string {
  return String(Math.round(bytes / (1024 * 1024)));
}

/**
 * Inner dialog body remounts when opened (via parent key) so form state
 * resets without setState-in-effect.
 */
function MarkdownImageDialogBody({
  labels,
  upload,
  initialAlt = "",
  disabled,
  onCancel,
  onInsert,
}: Omit<Props, "open">) {
  const titleId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);
  const [mode, setMode] = useState<Mode>(upload ? "upload" : "url");
  const [alt, setAlt] = useState(initialAlt);
  const [url, setUrl] = useState("https://");
  const [caption, setCaption] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => firstFieldRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (!uploadingRef.current) onCancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const resolvedUrl = mode === "upload" ? uploadedUrl : url.trim();
  const canInsert =
    !disabled &&
    !uploading &&
    Boolean(resolvedUrl) &&
    (mode === "url" ? resolvedUrl !== "https://" : Boolean(uploadedUrl));

  async function uploadFile(file: File) {
    if (!upload || uploadingRef.current || disabled) return;
    uploadingRef.current = true;
    setUploading(true);
    setError(null);
    setProgress(12);
    setUploadedUrl(null);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return objectUrl;
    });

    try {
      const form = new FormData();
      form.set("file", file);
      form.set("purpose", upload.purpose);
      if (alt.trim()) {
        form.set("altEn", alt.trim());
        form.set("altAr", alt.trim());
      }

      const progressTimer = window.setInterval(() => {
        setProgress((p) => (p >= 90 ? p : p + 8));
      }, 180);

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      window.clearInterval(progressTimer);

      const data = (await res.json().catch(() => null)) as {
        media?: AdminMediaRef;
        error?: { message?: string };
      } | null;

      if (!res.ok || !data?.media?.url) {
        setProgress(0);
        setError(data?.error?.message || labels.uploadFailed);
        setUploadedUrl(null);
        return;
      }

      setProgress(100);
      setUploadedUrl(data.media.url);
      setPreviewUrl(data.media.url);
      if (!alt.trim() && (data.media.altEn || data.media.altAr)) {
        setAlt(data.media.altEn || data.media.altAr || "");
      }
    } catch {
      setProgress(0);
      setError(labels.uploadFailed);
      setUploadedUrl(null);
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }
  }

  function confirm() {
    if (!canInsert || !resolvedUrl) return;
    onInsert({
      url: resolvedUrl,
      alt,
      title: caption.trim() || undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !uploadingRef.current) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white p-4 shadow-xl"
      >
        <h3 id={titleId} className="text-base font-semibold text-zinc-900">
          {labels.title}
        </h3>

        {upload ? (
          <div className="mt-3 flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
            {(
              [
                { key: "upload", label: labels.tabUpload },
                { key: "url", label: labels.tabUrl },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                disabled={disabled || uploading}
                onClick={() => setMode(key)}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-xs font-medium",
                  mode === key
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">{labels.alt}</span>
            <Input
              ref={firstFieldRef}
              value={alt}
              disabled={disabled || uploading}
              onChange={(e) => setAlt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canInsert) {
                  e.preventDefault();
                  confirm();
                }
              }}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">
              {labels.captionOptional}
            </span>
            <Input
              value={caption}
              disabled={disabled || uploading}
              onChange={(e) => setCaption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canInsert) {
                  e.preventDefault();
                  confirm();
                }
              }}
            />
          </label>

          {mode === "url" || !upload ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-700">{labels.url}</span>
              <Input
                value={url}
                placeholder="https://"
                disabled={disabled || uploading}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setPreviewUrl(e.target.value.trim() || null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canInsert) {
                    e.preventDefault();
                    confirm();
                  }
                }}
              />
            </label>
          ) : (
            <div className="flex flex-col gap-2">
              <MediaDropzone
                id={`${titleId}-upload`}
                accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                disabled={disabled || uploading}
                dropHint={labels.dropHint}
                hint={labels.fileHint.replace(
                  "{max}",
                  formatMaxMb(upload.maxImageBytes),
                )}
                error={error}
                onFile={(file) => void uploadFile(file)}
              />
              {uploading ? (
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-zinc-600">
                    {labels.uploading}
                  </p>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-zinc-200"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                  >
                    <div
                      className="h-full rounded-full bg-[var(--brand-blue)] transition-[width]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {previewUrl &&
          (mode === "url"
            ? /^https?:\/\//i.test(previewUrl) ||
              previewUrl.startsWith("/api/media/")
            : Boolean(previewUrl)) ? (
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={alt.trim() || labels.previewAlt}
                className="mx-auto max-h-48 w-auto max-w-full object-contain"
              />
            </div>
          ) : null}

          {mode === "url" && error ? (
            <p role="alert" className="text-xs text-red-600">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={uploading}
            onClick={onCancel}
          >
            {labels.cancel}
          </Button>
          <Button type="button" disabled={!canInsert} onClick={confirm}>
            {labels.insert}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MarkdownImageDialog({
  open,
  labels,
  upload,
  initialAlt = "",
  disabled,
  onCancel,
  onInsert,
}: Props) {
  if (!open) return null;
  return (
    <MarkdownImageDialogBody
      key={`image-dialog-${initialAlt}`}
      labels={labels}
      upload={upload}
      initialAlt={initialAlt}
      disabled={disabled}
      onCancel={onCancel}
      onInsert={onInsert}
    />
  );
}
