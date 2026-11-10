import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  children: ReactNode;
  className?: string;
  as?: "h2" | "h3";
};

/** Section heading with a short vertical brand-blue accent bar. */
export function AccentHeading({
  id,
  children,
  className,
  as: Tag = "h2",
}: Props) {
  return (
    <Tag
      id={id}
      className={cn(
        "anchor-offset flex items-stretch gap-3 font-editorial text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[1.75rem]",
        className,
      )}
    >
      <span
        className="mt-1 w-1 shrink-0 rounded-full bg-[var(--brand-blue)]"
        aria-hidden
      />
      <span>{children}</span>
    </Tag>
  );
}
