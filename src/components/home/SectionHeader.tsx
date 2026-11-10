import Link from "next/link";

import { cn } from "@/lib/utils";

type Action = {
  href: string;
  label: string;
};

type Props = {
  id: string;
  label: string;
  title: string;
  description: string;
  action: Action;
  className?: string;
};

export const sectionLabelClassName =
  "inline-flex w-fit items-center rounded-full bg-[color-mix(in_srgb,var(--brand-blue)_12%,white)] px-3 py-1 text-[12px] font-semibold tracking-[0.06em] text-[var(--brand-blue)] sm:text-[13px]";

export const sectionTitleClassName =
  "font-editorial mt-3 text-[clamp(1.625rem,2.8vw,2.5rem)] font-semibold leading-[1.15] tracking-tight text-balance text-zinc-900";

export const sectionActionClassName = cn(
  "inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-full border border-[var(--brand-blue)] bg-transparent px-5 text-sm font-medium text-[var(--brand-blue)]",
  "transition-colors hover:bg-[var(--brand-blue)] hover:text-white",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]",
);

/**
 * Editorial homepage section header: label + heading at inline-start,
 * description + outlined action at inline-end (mirrored in RTL).
 */
export function SectionHeader({
  id,
  label,
  title,
  description,
  action,
  className,
}: Props) {
  return (
    <header
      className={cn(
        "flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10",
        className,
      )}
    >
      <div className="min-w-0 max-w-xl">
        <p className={sectionLabelClassName}>{label}</p>
        <h2 id={id} className={sectionTitleClassName}>
          {title}
        </h2>
      </div>

      <div className="flex min-w-0 max-w-md flex-col gap-4 lg:items-end lg:text-end">
        <p className="text-[0.9375rem] leading-relaxed text-[var(--brand-gray)] text-pretty sm:text-base">
          {description}
        </p>
        <Link href={action.href} className={sectionActionClassName}>
          <span>{action.label}</span>
          <span aria-hidden className="rtl:rotate-180">
            →
          </span>
        </Link>
      </div>
    </header>
  );
}
