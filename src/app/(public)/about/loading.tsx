import { FounderCardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function AboutLoading() {
  return (
    <div className="public-main-offset w-full pb-16" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="relative aspect-[21/9] max-h-[280px] w-full overflow-hidden bg-zinc-200">
        <Skeleton className="absolute inset-0 rounded-none" />
      </div>
      <div className="mx-auto w-full space-y-12 px-4 pt-10 sm:px-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <FounderCardSkeleton />
        <FounderCardSkeleton />
      </div>
    </div>
  );
}
