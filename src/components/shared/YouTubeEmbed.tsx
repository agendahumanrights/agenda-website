import { parseYouTubeUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";

type Props = {
  url: string;
  title?: string;
  heading?: string;
  className?: string;
  /** Prefer eager load in admin preview; lazy on public pages. */
  loading?: "lazy" | "eager";
};

/**
 * Responsive 16:9 YouTube iframe built only from a validated video ID.
 * Renders nothing when the URL cannot be parsed.
 */
export function YouTubeEmbed({
  url,
  title = "YouTube video",
  heading,
  className,
  loading = "lazy",
}: Props) {
  const parsed = parseYouTubeUrl(url);
  if (!parsed) return null;

  return (
    <section className={cn("flex flex-col gap-3", className)}>
      {heading ? (
        <h2 className="text-sm font-semibold tracking-wide text-[var(--brand-blue)] uppercase">
          {heading}
        </h2>
      ) : null}
      <div className="overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200">
        <div className="relative aspect-video w-full">
          <iframe
            src={parsed.embedUrl}
            title={title}
            loading={loading}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>
    </section>
  );
}
