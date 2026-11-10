import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  count: number;
  children: ReactNode;
  className?: string;
};

/**
 * Homepage featured card row — same full-width 1/2/3-col grid as listing pages
 * (no centered max-width caps that leave large side gutters).
 */
export function HomeFeaturedGrid({ count, children, className }: Props) {
  return (
    <ul
      className={cn(
        "grid grid-cols-1 gap-5 sm:gap-6 lg:gap-8",
        count <= 0 && "hidden",
        count >= 1 && "sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {children}
    </ul>
  );
}
