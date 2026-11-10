import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
  /** Decorative only; parent should set aria-busy / role=status when needed. */
  "aria-hidden"?: boolean;
};

/** Soft pulse block matching Agenda neutrals. Respects prefers-reduced-motion via CSS. */
export function Skeleton({ className, ...rest }: SkeletonProps) {
  return (
    <div
      className={cn("agenda-skeleton rounded-md bg-zinc-200/80", className)}
      {...rest}
    />
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <article
      className={cn("flex flex-col overflow-hidden", className)}
      aria-hidden
    >
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-2 px-0.5 pt-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-[92%]" />
        <Skeleton className="h-5 w-[70%]" />
        <Skeleton className="mt-2 h-3 w-28" />
      </div>
    </article>
  );
}

export function HeroSliderSkeleton() {
  return (
    <section
      className="hero-viewport relative w-full overflow-hidden bg-[color-mix(in_srgb,var(--brand-blue)_88%,#021a33)]"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--brand-blue),#032f5c)]" />
      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-20 pt-[var(--site-header-offset)] sm:px-10">
        <Skeleton className="h-3 w-24 bg-white/25" />
        <Skeleton className="mt-4 h-10 w-[min(100%,28rem)] bg-white/30" />
        <Skeleton className="mt-3 h-4 w-[min(100%,22rem)] bg-white/20" />
        <Skeleton className="mt-8 h-10 w-36 bg-white/25" />
      </div>
    </section>
  );
}

export function CatalogueGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading…</span>
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10" aria-busy="true">
      <Skeleton className="h-3 w-48" />
      <Skeleton className="mt-6 h-4 w-24" />
      <Skeleton className="mt-4 h-10 w-[90%]" />
      <Skeleton className="mt-3 h-5 w-[70%]" />
      <Skeleton className="mt-8 aspect-[16/10] w-full" />
      <div className="mt-8 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[95%]" />
        <Skeleton className="h-4 w-[88%]" />
        <Skeleton className="h-4 w-[92%]" />
      </div>
    </div>
  );
}

export function FounderCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-6" aria-hidden>
      <Skeleton className="h-40 w-40 shrink-0 rounded-full" />
      <div className="flex-1 space-y-3 pt-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[80%]" />
      </div>
    </div>
  );
}

export function AdminTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-10 w-full max-w-sm" />
      <div className="overflow-hidden rounded-lg border border-[var(--border)]">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-[var(--border)] px-4 py-3 last:border-b-0"
          >
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-4 w-24 sm:block" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
