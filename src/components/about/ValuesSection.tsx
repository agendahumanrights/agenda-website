import { AboutValueIcon } from "@/components/about/AboutIcons";
import { AccentHeading } from "@/components/about/AccentHeading";
import type { AboutValueItem } from "@/content/about";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  items: AboutValueItem[];
  className?: string;
};

export function ValuesSection({ title, items, className }: Props) {
  return (
    <section
      id="about-values"
      aria-labelledby="values-heading"
      className={cn("anchor-offset", className)}
    >
      <AccentHeading id="values-heading" className="mb-8 sm:mb-10">
        {title}
      </AccentHeading>

      <ul className="grid list-none grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:gap-6">
        {items.map((item, index) => {
          const number = String(index + 1).padStart(2, "0");
          return (
            <li
              key={item.title}
              className={cn(
                "flex h-full flex-col gap-3 rounded-2xl bg-white p-5 sm:p-6",
                "shadow-[0_8px_28px_rgba(5,73,140,0.06)]",
                "ring-1 ring-[color-mix(in_srgb,var(--brand-blue)_10%,transparent)]",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "inline-flex size-11 shrink-0 items-center justify-center rounded-full",
                    "bg-[color-mix(in_srgb,var(--brand-blue)_8%,white)]",
                    "ring-1 ring-[color-mix(in_srgb,var(--brand-blue)_14%,transparent)]",
                  )}
                  aria-hidden
                >
                  <AboutValueIcon id={item.icon} className="size-5" />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-[var(--brand-blue)] uppercase">
                    {number}
                  </p>
                  <h3 className="mt-1 font-editorial text-lg font-semibold tracking-tight text-zinc-900">
                    {item.title}
                  </h3>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-pretty text-zinc-700 sm:text-[0.95rem] sm:leading-[1.7]">
                {item.description}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
