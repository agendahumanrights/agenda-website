import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "brand" | "danger";
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { children, className, variant = "primary", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition-colors disabled:opacity-50",
        "min-h-11",
        variant === "primary" &&
          "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800",
        variant === "brand" &&
          "border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white hover:bg-[#043a70]",
        variant === "secondary" &&
          "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50",
        variant === "ghost" &&
          "border-transparent bg-transparent text-zinc-700 hover:bg-zinc-100",
        variant === "danger" &&
          "border-red-700 bg-red-700 text-white hover:bg-red-800",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
