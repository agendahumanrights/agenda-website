import { FounderProfileImage } from "@/components/about/FounderProfileImage";
import type { FounderDetail } from "@/types/founder";
import { cn } from "@/lib/utils";

type Props = {
  founder: FounderDetail;
  /** On desktop, place the biography panel before the portrait (alternating rows). */
  reverse?: boolean;
  /** Localized label for the mailto contact link (e.g. "Email"). */
  emailLabel: string;
};

function EnvelopeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M2.5 5.5A1.5 1.5 0 0 1 4 4h12a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 16 16H4a1.5 1.5 0 0 1-1.5-1.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m3.5 6.25 6.05 4.2a.75.75 0 0 0 .9 0l6.05-4.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Full founder profile for About Us. Anchor id `founder-{bioKey}` is required
 * for publication author deep links.
 *
 * Desktop: nearly full content width — fixed-size circular portrait + flexible
 * biography card. Card and copy fill the remaining row width.
 */
export function FounderBiography({
  founder,
  reverse = false,
  emailLabel,
}: Props) {
  const area = founder.professionalArea?.trim() || null;
  const email = founder.email?.trim() || null;
  const biography = founder.biography?.trim() || null;

  return (
    <article
      id={`founder-${founder.bioKey}`}
      className={cn(
        "anchor-offset flex w-full flex-col items-center gap-6 sm:gap-7",
        "lg:flex-row lg:items-start lg:gap-8 xl:gap-10 2xl:gap-12",
        reverse && "lg:flex-row-reverse",
      )}
    >
      <FounderProfileImage
        src={founder.profileImageUrl}
        alt={founder.fullName}
        className="size-44 shrink-0 sm:size-52 lg:size-60 xl:size-64"
      />

      <div
        className={cn(
          "w-full min-w-0 flex-1 rounded-3xl",
          "bg-[color-mix(in_srgb,var(--brand-blue)_3.5%,white)]",
          "p-6 sm:p-7 lg:p-8 xl:p-9",
          "shadow-[0_10px_32px_rgba(5,73,140,0.07)]",
          "ring-1 ring-[color-mix(in_srgb,var(--brand-blue)_10%,transparent)]",
        )}
      >
        <h3 className="font-editorial text-xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-2xl">
          {founder.fullName}
        </h3>

        {area ? (
          <p className="mt-2 text-sm font-medium text-[var(--brand-blue)] sm:text-base">
            {area}
          </p>
        ) : null}

        {biography ? (
          <p className="mt-4 whitespace-pre-wrap text-base leading-[1.7] text-pretty text-zinc-700 sm:mt-5 sm:text-[1.0625rem] sm:leading-[1.75]">
            {biography}
          </p>
        ) : null}

        {email ? (
          <a
            href={`mailto:${email}`}
            className={cn(
              "mt-5 inline-flex max-w-full items-center gap-2 text-sm text-[var(--brand-gray)] sm:mt-6",
              "underline-offset-4 hover:text-[var(--brand-blue)] hover:underline",
              "focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]",
            )}
          >
            <EnvelopeIcon className="size-4 shrink-0 text-[var(--brand-blue)]" />
            <span className="min-w-0">
              <span className="font-medium text-zinc-600">{emailLabel}: </span>
              <span className="break-all">{email}</span>
            </span>
          </a>
        ) : null}
      </div>
    </article>
  );
}
