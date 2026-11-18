import { DetailSkeleton } from "@/components/ui/Skeleton";

export default function WriterProfileLoading() {
  return (
    <div className="public-main-offset pb-16">
      <DetailSkeleton />
    </div>
  );
}
