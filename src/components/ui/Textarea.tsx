import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: Props) {
  return (
    <textarea
      className={cn(
        "w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900",
        className,
      )}
      {...props}
    />
  );
}
