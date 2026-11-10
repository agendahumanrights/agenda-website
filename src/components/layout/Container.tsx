import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
};

export function Container({ children, className }: Props) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}
