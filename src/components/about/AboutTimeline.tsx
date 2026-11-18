import { AboutTimelineIcon } from "@/components/about/AboutIcons";
import { AccentHeading } from "@/components/about/AccentHeading";
import type { AboutTimelineItem } from "@/content/about";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  headingId: string;
  title: string;
  items: AboutTimelineItem[];
  /** Visual variant: white page vs soft blue wash. */
  tone?: "default" | "soft";
  className?: string;
};

/**
 * Alternating vertical timeline for Strategic Goals / Program Areas.
 * Desktop: center spine with text alternating sides. Mobile: start-side spine.
 * Uses logical CSS so RTL mirrors correctly.
 */
export function AboutTimeline({
  id,
  headingId,
  title,
  items,
  tone = "default",
  className,
}: Props) {
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("anchor-offset", className)}
    >
      <div
        className={cn(
          "rounded-[1.75rem] px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14",
          tone === "soft"
            ? "bg-[color-mix(in_srgb,var(--brand-blue)_5%,white)] ring-1 ring-[color-mix(in_srgb,var(--brand-blue)_10%,transparent)]"
            : "bg-white ring-1 ring-[color-mix(in_srgb,var(--brand-blue)_8%,transparent)]",
        )}
      >
        <AccentHeading id={headingId} className="mb-10 sm:mb-12 lg:justify-center">
          {title}
        </AccentHeading>

        <ol className="about-timeline relative mx-auto max-w-5xl list-none">
          <div className="about-timeline-spine" aria-hidden />

          {items.map((item, index) => {
            const textOnEnd = index % 2 === 0;
            const number = String(index + 1).padStart(2, "0");

            return (
              <li
                key={`${item.title}-${index}`}
                className={cn(
                  "about-timeline-item relative",
                  textOnEnd
                    ? "about-timeline-item--end"
                    : "about-timeline-item--start",
                )}
              >
                <div className="about-timeline-node" aria-hidden>
                  <span className="about-timeline-node-ring" />
                  <span className="about-timeline-node-disc">
                    <AboutTimelineIcon id={item.icon} className="size-[1.35rem]" />
                  </span>
                </div>

                <div className="about-timeline-copy">
                  <p className="mb-1.5 text-xs font-semibold tracking-[0.14em] text-[var(--brand-blue)] uppercase">
                    {number}
                  </p>
                  <h3 className="font-editorial text-lg font-semibold tracking-tight text-balance text-zinc-900 sm:text-xl">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-pretty text-zinc-700 sm:text-[0.975rem] sm:leading-[1.7] lg:max-w-sm xl:max-w-md">
                    {item.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
