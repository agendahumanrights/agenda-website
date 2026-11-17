import Link from "next/link";

import { cn } from "@/lib/utils";

type Action = {
  href: string;
  label: string;
};

type Props = {
  id: string;
  title: string;
  action: Action;
  className?: string;
};

/** Kept for About teaser and other homepage surfaces that match section chrome. */
export const sectionTitleClassName =
  "font-editorial text-[clamp(1.625rem,2.8vw,2.5rem)] font-semibold leading-[1.15] tracking-tight text-balance text-zinc-900";

export const sectionActionClassName = cn(
  "inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-full border border-[var(--brand-blue)] bg-transparent px-5 text-sm font-medium text-[var(--brand-blue)]",
  "transition-colors hover:bg-[var(--brand-blue)] hover:text-white",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]",
);

/**
 * Homepage section header: heading + outlined action on one row (stacks on
 * mobile; RTL-aware). Decorative pill labels and intro blurbs are not used.
 */
export function SectionHeader({ id, title, action, className }: Props) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6",
        className,
      )}
    >
      <div className="min-w-0 max-w-xl">
        <h2 id={id} className={sectionTitleClassName}>
          {title}
        </h2>
      </div>

      <div className="flex min-w-0 shrink-0 lg:items-end">
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
