"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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

function isAbsoluteHttpUrl(src: string): boolean {
  return /^https?:\/\//i.test(src);
}

type Mode = "next" | "native";

/**
 * Reliable media image:
 * - Absolute R2/CDN URLs try `next/image` with `unoptimized` (direct CDN, no
 *   optimizer proxy — avoids broken gallery frames when the optimizer fails).
 * - On any `next/image` error, seamlessly fall back to a native `<img>`.
 * - Relative `/api/media` keys always use native `<img>` (access-checked).
 * - `onError` fires only after native loading also fails.
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
  const absolute = isAbsoluteHttpUrl(src);
  const [mode, setMode] = useState<Mode>(absolute ? "next" : "native");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setMode(absolute ? "next" : "native");
    setFailed(false);
  }, [src, absolute]);

  if (failed) return null;

  function failCompletely() {
    setFailed(true);
    onError?.();
  }

  if (mode === "next" && absolute) {
    if (fill) {
      return (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized
          onError={() => setMode("native")}
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
        unoptimized
        onError={() => setMode("native")}
        className={cn(className)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- CDN fallback + /api/media
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      onError={failCompletely}
      className={cn(fill && "absolute inset-0 h-full w-full", className)}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
    />
  );
}
