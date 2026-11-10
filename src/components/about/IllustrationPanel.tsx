import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * White illustration panel with soft shadow and pale decorative circles
 * (inspired by the About design reference; branded for Agenda).
 */
export function IllustrationPanel({ children, className }: Props) {
  return (
    <div className={cn("relative mx-auto w-full max-w-md lg:mx-0", className)}>
      <div
        className="pointer-events-none absolute -top-3 -end-3 h-14 w-14 rounded-full bg-[color-mix(in_srgb,var(--brand-blue)_14%,white)] sm:h-16 sm:w-16"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-4 -start-3 h-12 w-12 rounded-full bg-[color-mix(in_srgb,var(--brand-gray)_18%,white)] sm:h-14 sm:w-14"
        aria-hidden
      />
      <div className="relative flex aspect-square items-center justify-center rounded-2xl bg-white p-8 shadow-[0_10px_30px_rgba(5,73,140,0.1)] ring-1 ring-[color-mix(in_srgb,var(--brand-blue)_8%,transparent)] sm:p-10">
        {children}
      </div>
    </div>
  );
}
