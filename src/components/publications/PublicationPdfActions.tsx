"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  url: string | null;
  labels: {
    viewPdf: string;
    downloadPdf: string;
    downloadFailed: string;
  };
  className?: string;
};

function withDownloadParam(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    parsed.searchParams.set("download", "1");
    return parsed.toString();
  } catch {
    const join = url.includes("?") ? "&" : "?";
    return `${url}${join}download=1`;
  }
}

/**
 * Compact PDF actions for publication details (no embedded preview).
 * Same-origin `/api/media` downloads use `?download=1` for Content-Disposition.
 * Cross-origin R2 public URLs fetch with credentials omitted (bucket CORS GET required).
 */
export function PublicationPdfActions({ url, labels, className }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  if (!url) return null;

  async function downloadPdf() {
    setError(false);
    setPending(true);
    try {
      const target = withDownloadParam(url!);
      const absolute = new URL(target, window.location.origin);
      const sameOrigin = absolute.origin === window.location.origin;

      const response = await fetch(absolute.toString(), {
        method: "GET",
        // R2 public URLs are cross-origin; omit cookies and require bucket CORS GET.
        credentials: sameOrigin ? "same-origin" : "omit",
        mode: "cors",
      });
      if (!response.ok) throw new Error("download failed");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = /filename="([^"]+)"/i.exec(disposition);
      const filename = match?.[1] || "document.pdf";

      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  const baseButton =
    "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)] sm:w-auto";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            baseButton,
            "bg-[var(--brand-blue)] text-white hover:bg-[#043a70]",
          )}
        >
          <ViewIcon />
          <span>{labels.viewPdf}</span>
        </a>
        <button
          type="button"
          onClick={downloadPdf}
          disabled={pending}
          className={cn(
            baseButton,
            "border border-[var(--brand-blue)] bg-white text-[var(--brand-blue)] hover:bg-[color-mix(in_srgb,var(--brand-blue)_6%,white)] disabled:opacity-60",
          )}
        >
          <DownloadIcon />
          <span>{labels.downloadPdf}</span>
        </button>
      </div>
      {error ? (
        <p className="text-xs text-red-700" role="status">
          {labels.downloadFailed}
        </p>
      ) : null}
    </div>
  );
}

function ViewIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 2.5h7.5L13 5v8.5H3V2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10.5 2.5V5H13" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5.5 8h5M5.5 10.5h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 2.5v7.5M5.5 7.5 8 10l2.5-2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 12.5h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
