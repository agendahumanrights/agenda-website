"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  className?: string;
  /** Use for LCP / above-the-fold images only. */
  priority?: boolean;
  sizes?: string;
  /** `fill` parent must be `position: relative` (or absolute/fixed). */
  fill?: boolean;
  width?: number;
  height?: number;
  onError?: () => void;
};

function canOptimize(src: string): boolean {
  return /^https?:\/\//i.test(src);
}

/**
 * Uses `next/image` for absolute http(s) URLs (e.g. R2 CDN).
 * Falls back to `<img>` for same-origin `/api/media` keys (access-checked).
 */
export function SoftImage({
  src,
  alt,
  className,
  priority = false,
  sizes,
  fill = false,
  width,
  height,
  onError,
}: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  function handleError() {
    setFailed(true);
    onError?.();
  }

  if (canOptimize(src)) {
    if (fill) {
      return (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onError={handleError}
          className={cn(className)}
        />
      );
    }
    return (
      <Image
        src={src}
        alt={alt}
        width={width ?? 1200}
        height={height ?? 800}
        sizes={sizes}
        priority={priority}
        onError={handleError}
        className={cn(className)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- legacy /api/media delivery
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      onError={handleError}
      className={cn(fill && "absolute inset-0 h-full w-full", className)}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
    />
  );
}
