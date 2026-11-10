import {
  CatalogueGridSkeleton,
  HeroSliderSkeleton,
  Skeleton,
} from "@/components/ui/Skeleton";

/** Global fallback while a route segment suspends. */
export default function RootLoading() {
  return (
    <div className="flex flex-1 flex-col" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <HeroSliderSkeleton />
      <div className="public-main-offset mx-auto w-full px-4 pb-16 pt-10 sm:px-6">
        <Skeleton className="mb-6 h-8 w-48" />
        <CatalogueGridSkeleton count={3} />
      </div>
    </div>
  );
}
