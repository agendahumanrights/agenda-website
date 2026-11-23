import { ArticleMarkdown } from "@/components/shared/ArticleMarkdown";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { WriterPublicProfile, WriterSocialPlatform } from "@/types/writer";
import { cn } from "@/lib/utils";

type Labels = Dictionary["writers"];

type Props = {
  writer: WriterPublicProfile;
  labels: Labels;
  locale: Locale;
};

const PLATFORM_LABELS: Record<WriterSocialPlatform, keyof Labels> = {
  facebook: "platformFacebook",
  x: "platformX",
  linkedin: "platformLinkedIn",
  instagram: "platformInstagram",
  youtube: "platformYouTube",
  website: "platformWebsite",
};

export function WriterProfile({ writer, labels, locale }: Props) {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const biography = writer.biography.trim();
  const major = writer.major.trim();
  const email = writer.email?.trim() || null;
  const hasContact = Boolean(email) || writer.socialLinks.length > 0;

  return (
    <div dir={dir} className="mx-auto flex w-full max-w-4xl flex-col gap-8 sm:gap-10">
      <section
        aria-labelledby="writer-profile-heading"
        className={cn(
          "overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--brand-blue)_12%,transparent)] bg-white",
          "shadow-[0_12px_36px_-22px_rgba(5,73,140,0.4)]",
        )}
      >
        <div className="bg-[linear-gradient(160deg,color-mix(in_srgb,var(--brand-blue)_10%,white),white_58%)] px-5 py-7 sm:px-8 sm:py-8 lg:px-9 lg:py-9">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
            <div className="relative size-44 shrink-0 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--brand-blue)_10%,white)] ring-4 ring-white shadow-md sm:size-48 lg:size-52">
              {writer.profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={writer.profileImageUrl}
                  alt={labels.portraitAlt.replace("{name}", writer.fullName)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-[var(--brand-blue)]"
                  aria-hidden
                >
                  <svg viewBox="0 0 24 24" className="h-16 w-16" fill="none">
                    <circle
                      cx="12"
                      cy="9"
                      r="3.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
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

            <div className="min-w-0 flex-1 text-center sm:pt-1 sm:text-start">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue)]">
                {labels.profileEyebrow}
              </p>
              <h1
                id="writer-profile-heading"
                className="mt-2 text-3xl font-semibold tracking-tight text-balance text-[var(--brand-blue)] sm:text-[2rem] lg:text-[2.25rem]"
              >
                {writer.fullName}
              </h1>
              {major ? (
                <p className="mt-2 text-base font-medium text-zinc-600 sm:text-lg">
                  {major}
                </p>
              ) : null}

              {hasContact ? (
                <div
                  className={cn(
                    "mt-5 flex flex-col items-center gap-3 sm:items-start",
                    "sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2.5",
                  )}
                >
                  {email ? (
                    <a
                      href={`mailto:${email}`}
                      className={cn(
                        "inline-flex max-w-full items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--brand-blue)_16%,transparent)] bg-white px-3.5 py-2",
                        "text-sm font-medium text-[var(--brand-blue)]",
                        "transition-colors hover:bg-[color-mix(in_srgb,var(--brand-blue)_6%,white)]",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]",
                      )}
                    >
                      <MailIcon className="size-4 shrink-0" />
                      <span className="min-w-0 break-all">{email}</span>
                      <span className="sr-only">{labels.emailAction}</span>
                    </a>
                  ) : null}

                  {writer.socialLinks.length > 0 ? (
                    <ul className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                      {writer.socialLinks.map((link) => {
                        const labelKey = PLATFORM_LABELS[link.platform];
                        const label = labels[labelKey];
                        return (
                          <li key={link.platform}>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "inline-flex size-10 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--brand-blue)_18%,transparent)] bg-white text-[var(--brand-blue)] transition-colors",
                                "hover:bg-[color-mix(in_srgb,var(--brand-blue)_8%,white)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]",
                              )}
                              aria-label={labels.socialLinkLabel
                                .replace("{platform}", label)
                                .replace("{name}", writer.fullName)}
                            >
                              <SocialIcon platform={link.platform} />
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {biography ? (
        <section
          aria-labelledby="writer-about-heading"
          className={cn(
            "rounded-2xl border border-[color-mix(in_srgb,var(--brand-blue)_10%,transparent)] bg-white",
            "px-5 py-7 shadow-[0_10px_28px_-20px_rgba(5,73,140,0.35)] sm:px-8 sm:py-8 lg:px-9",
          )}
        >
          <h2
            id="writer-about-heading"
            className="text-xl font-semibold tracking-tight text-[var(--brand-blue)] sm:text-2xl"
          >
            {labels.aboutHeading}
          </h2>
          <div className="mt-5 max-w-3xl">
            <ArticleMarkdown
              source={biography}
              locale={locale}
              className="article-prose--align-start"
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <rect
        x="2.5"
        y="4.5"
        width="15"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3.5 6.5 10 11l6.5-4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SocialIcon({ platform }: { platform: WriterSocialPlatform }) {
  const common = "size-5";
  switch (platform) {
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden fill="currentColor">
          <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1Z" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden fill="currentColor">
          <path d="M4 4h4.2l4.1 5.7L17.6 4H20l-6.2 7.2L20.5 20h-4.2l-4.5-6.2L6.4 20H4l6.6-7.7L4 4Z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden fill="currentColor">
          <path d="M6.5 9.5H3.7V20h2.8V9.5ZM5.1 4a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4ZM20.3 20h-2.8v-5.6c0-1.5-.6-2.5-1.9-2.5-1 0-1.5.7-1.8 1.3-.1.2-.1.6-.1.9V20h-2.8s.0-9.7 0-10.5h2.8v1.5c.4-.6 1.1-1.7 2.8-1.7 2 0 3.6 1.3 3.6 4.2V20Z" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden fill="none">
          <rect x="3.5" y="3.5" width="17" height="17" rx="4" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden fill="currentColor">
          <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 5 12 5 12 5s-6 0-7.7.3A2.7 2.7 0 0 0 2.4 7.2 28.6 28.6 0 0 0 2 12a28.6 28.6 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9C6 19 12 19 12 19s6 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9A28.6 28.6 0 0 0 22 12a28.6 28.6 0 0 0-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z" />
        </svg>
      );
    case "website":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden fill="none">
          <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3.75 12h16.5M12 3.75c2.2 2.4 3.3 5.2 3.3 8.25S14.2 17.85 12 20.25M12 3.75C9.8 6.15 8.7 8.95 8.7 12s1.1 5.85 3.3 8.25" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    default: {
      const _exhaustive: never = platform;
      return _exhaustive;
    }
  }
}
