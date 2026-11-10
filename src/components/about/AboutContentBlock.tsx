import type { ReactNode } from "react";

import { AccentHeading } from "@/components/about/AccentHeading";
import { IllustrationPanel } from "@/components/about/IllustrationPanel";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  title: string;
  body: string;
  illustration: ReactNode;
  /** Swap illustration/text columns on desktop for visual rhythm. */
  reverse?: boolean;
  className?: string;
};

export function AboutContentBlock({
  id,
  title,
  body,
  illustration,
  reverse = false,
  className,
}: Props) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "anchor-offset grid items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16",
        className,
      )}
    >
      <div className={cn(reverse && "lg:order-2")}>
        <IllustrationPanel>{illustration}</IllustrationPanel>
      </div>
      <div className={cn("flex flex-col gap-4", reverse && "lg:order-1")}>
        <AccentHeading id={id}>{title}</AccentHeading>
        <p className="max-w-xl text-base leading-relaxed text-zinc-700 text-pretty sm:text-lg sm:leading-relaxed">
          {body}
        </p>
      </div>
    </section>
  );
}
