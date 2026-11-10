import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
};

/** Shared shell for public catalogue filter toolbars. */
export function CatalogueToolbar({
  children,
  className,
  "aria-label": ariaLabel,
}: Props) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        "rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export const catalogueControlClassName =
  "min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-sm transition placeholder:text-zinc-400 focus-visible:border-[var(--brand-blue)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[var(--brand-blue)] disabled:opacity-60";

export const cataloguePrimaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--brand-blue)] bg-[var(--brand-blue)] px-5 text-sm font-medium text-white transition hover:bg-[#043a70] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)] disabled:opacity-60";

export const catalogueSecondaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-transparent bg-transparent px-3 text-sm font-medium text-zinc-700 underline-offset-2 transition hover:text-[var(--brand-blue)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)] disabled:opacity-60";
