"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  src: string | null;
  alt: string;
  className?: string;
};

/**
 * Circular founder portrait with soft brand ring.
 * Falls back to a neutral silhouette when the image is missing or fails.
 */
export function FounderProfileImage({ src, alt, className }: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full",
        "bg-[color-mix(in_srgb,var(--brand-blue)_8%,white)]",
        "ring-2 ring-[color-mix(in_srgb,var(--brand-blue)_28%,white)]",
        "shadow-[0_0_0_6px_color-mix(in_srgb,var(--brand-blue)_8%,transparent)]",
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- dynamic /api/media URLs
        <img
          src={src!}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover object-top"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-[linear-gradient(145deg,color-mix(in_srgb,var(--brand-blue)_14%,white),color-mix(in_srgb,var(--brand-blue)_6%,white))]"
          aria-hidden
        >
          <svg
            viewBox="0 0 48 48"
            className="h-[42%] w-[42%] text-[var(--brand-blue)] opacity-65"
            fill="none"
            aria-hidden
          >
            <circle
              cx="24"
              cy="18"
              r="8"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <path
              d="M10 40c2-8 8-12 14-12s12 4 14 12"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
