import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Props = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900",
        className,
      )}
      {...props}
    />
  );
});
