import { AuthorLink } from "@/components/publications/AuthorLink";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  bioKey: string;
  professionalArea: string | null;
  imageUrl: string | null;
  locale?: Locale;
  className?: string;
};

export function PublicationAuthor({
  name,
  bioKey,
  professionalArea,
  imageUrl,
  locale,
  className,
}: Props) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--brand-blue)_12%,white)] ring-1 ring-[color-mix(in_srgb,var(--brand-blue)_15%,transparent)]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-[var(--brand-blue)]"
            aria-hidden
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
              <circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M5 19c1.5-3.5 4-5 7-5s5.5 1.5 7 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="min-w-0">
        <AuthorLink
          bioKey={bioKey}
          name={name}
          locale={locale}
          className="font-medium text-[var(--brand-blue)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]"
        />
        {professionalArea ? (
          <p className="mt-0.5 text-sm text-[var(--brand-gray)]">{professionalArea}</p>
        ) : null}
      </div>
    </div>
  );
}
