import { CatalogueGridSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function EventsLoading() {
  return (
    <div className="public-main-offset w-full pb-16" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="relative aspect-[21/9] max-h-[280px] w-full overflow-hidden bg-zinc-200">
        <Skeleton className="absolute inset-0 rounded-none" />
      </div>
      <div className="mx-auto w-full px-4 pt-8 sm:px-6">
        <Skeleton className="mb-6 h-12 w-full max-w-3xl" />
        <CatalogueGridSkeleton count={6} />
      </div>
    </div>
  );
}
