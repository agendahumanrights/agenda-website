import Link from "next/link";

import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type Props = {
  items: BreadcrumbItem[];
  label: string;
  className?: string;
  /** `onDark` for heroes over brand-blue gradients. */
  tone?: "default" | "onDark";
};

export function Breadcrumbs({
  items,
  label,
  className,
  tone = "default",
}: Props) {
  const onDark = tone === "onDark";

  return (
    <nav
      aria-label={label}
      className={cn(
        "text-sm",
        onDark ? "text-white/70" : "text-[var(--brand-gray)]",
        className,
      )}
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? (
                <span
                  aria-hidden
                  className={onDark ? "text-white/35" : "text-zinc-300"}
                >
                  /
                </span>
              ) : null}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    "transition-colors",
                    onDark
                      ? "hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      : "hover:text-[var(--brand-blue)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]",
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    isLast &&
                      (onDark
                        ? "font-medium text-white"
                        : "font-medium text-zinc-700"),
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
