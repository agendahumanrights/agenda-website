import Image from "next/image";

import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "@/components/shared/Breadcrumbs";
import type { PageHeroImageConfig } from "@/content/page-heroes";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  image: PageHeroImageConfig;
  breadcrumbs: BreadcrumbItem[];
  breadcrumbLabel: string;
  /** Wave / content surface under the hero curve. */
  contentBackgroundClassName?: string;
  className?: string;
};

/**
 * Full-bleed catalogue/About introduction. Starts at the viewport top so the
 * fixed glass header overlays the gradient; content padding clears the nav.
 */
export function PageHero({
  title,
  description,
  image,
  breadcrumbs,
  breadcrumbLabel,
  contentBackgroundClassName = "bg-white",
  className,
}: Props) {
  const decorative = !image.alt.trim();

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden",
        "bg-[linear-gradient(155deg,#032a54_0%,#05498c_48%,#0a5aa8_100%)]",
        className,
      )}
    >
      {/* Subtle curved accents — decorative only */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <svg
          className="absolute -start-8 top-16 h-[70%] w-[55%] opacity-[0.14] sm:opacity-[0.18]"
          viewBox="0 0 400 400"
          fill="none"
        >
          <path
            d="M-20 80C80 40 140 160 240 110C320 70 360 150 420 120"
            stroke="white"
            strokeWidth="1.5"
          />
          <path
            d="M-40 160C60 110 160 230 260 170C340 120 380 220 440 180"
            stroke="white"
            strokeWidth="1.25"
            opacity="0.7"
          />
          <path
            d="M-10 240C90 200 150 300 250 250C330 210 370 300 430 270"
            stroke="white"
            strokeWidth="1"
            opacity="0.5"
          />
        </svg>
        <div className="absolute -end-24 top-1/4 size-[22rem] rounded-full bg-white/[0.06] blur-2xl" />
        <div className="absolute bottom-16 start-1/3 size-40 rounded-full bg-white/[0.05]" />
      </div>

      <div
        className={cn(
          "relative mx-auto flex w-full flex-col gap-8 px-4",
          "pb-16 pt-[var(--site-header-offset)]",
          "sm:gap-10 sm:px-6 sm:pb-20",
          "lg:min-h-[min(34rem,70vh)] lg:flex-row lg:items-center lg:gap-12 lg:px-8 lg:pb-24",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:max-w-xl lg:gap-5">
          <Breadcrumbs
            items={breadcrumbs}
            label={breadcrumbLabel}
            tone="onDark"
          />
          <h1 className="font-editorial text-[clamp(2rem,4.2vw,3.5rem)] font-semibold leading-[1.12] tracking-tight text-balance text-white">
            {title}
          </h1>
          <span
            className="h-0.5 w-16 rounded-full bg-[color-mix(in_srgb,#9fd0ff_70%,white)] sm:w-20"
            aria-hidden
          />
          <p className="max-w-lg text-base leading-relaxed text-white/88 text-pretty sm:text-lg sm:leading-relaxed">
            {description}
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-md shrink-0 lg:mx-0 lg:max-w-none lg:basis-[44%]">
          <div
            className="pointer-events-none absolute -inset-3 rounded-[1.35rem] bg-white/10 blur-md sm:-inset-4"
            aria-hidden
          />
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border border-white/35 bg-white/10 shadow-[0_18px_40px_rgba(2,24,48,0.35)]",
              "aspect-[4/3] backdrop-blur-[2px]",
            )}
          >
            <Image
              src={image.src}
              alt={decorative ? "" : image.alt}
              fill
              sizes="(max-width: 1024px) 90vw, 42vw"
              className="object-cover"
              style={{ objectPosition: image.objectPosition }}
              priority
              unoptimized={image.src.endsWith(".svg")}
            />
          </div>
        </div>
      </div>

      {/* Gentle curve into page content */}
      <div
        className={cn("pointer-events-none relative -mb-px h-10 sm:h-12", contentBackgroundClassName)}
        aria-hidden
        style={{
          clipPath: "ellipse(115% 100% at 50% 100%)",
        }}
      />
    </section>
  );
}
