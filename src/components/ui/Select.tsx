import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Props = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: Props) {
  return (
    <select
      className={cn(
        "w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
