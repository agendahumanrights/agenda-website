"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  src: string | null;
  alt: string;
  className?: string;
};

/**
 * 4:3 media with branded fallback when the URL is missing or fails to load.
 */
export function CardMedia({ src, alt, className }: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cn(
        "relative aspect-[4/3] overflow-hidden bg-[color-mix(in_srgb,var(--brand-blue)_88%,#021a33)]",
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
          className="card-media-image h-full w-full object-cover object-center transition-transform duration-500 ease-out"
        />
      ) : (
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,color-mix(in_srgb,white_16%,transparent),transparent_55%),linear-gradient(145deg,var(--brand-blue),#032f5c)]"
          aria-hidden
        />
      )}
    </div>
  );
}
