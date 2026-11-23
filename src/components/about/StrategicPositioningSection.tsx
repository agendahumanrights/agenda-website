import { AccentHeading } from "@/components/about/AccentHeading";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  paragraphs: readonly [string, string];
  className?: string;
};

/** Editorial statement block for strategic positioning. */
export function StrategicPositioningSection({
  title,
  paragraphs,
  className,
}: Props) {
  return (
    <section
      id="about-strategic-positioning"
      aria-labelledby="strategic-positioning-heading"
      className={cn("anchor-offset", className)}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-[1.75rem]",
          "bg-[color-mix(in_srgb,var(--brand-blue)_6%,white)]",
          "px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14",
          "ring-1 ring-[color-mix(in_srgb,var(--brand-blue)_12%,transparent)]",
        )}
      >
        <div
          className="pointer-events-none absolute -top-16 -end-10 size-48 rounded-full bg-[color-mix(in_srgb,var(--brand-blue)_10%,transparent)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -start-8 size-56 rounded-full bg-[color-mix(in_srgb,var(--brand-blue)_8%,transparent)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-3xl">
          <AccentHeading id="strategic-positioning-heading">
            {title}
          </AccentHeading>

          <div className="mt-6 space-y-5 sm:mt-7 sm:space-y-6">
            {paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 48)}
                className="ar-body text-base leading-relaxed text-pretty text-zinc-700 sm:text-lg sm:leading-[1.75]"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
