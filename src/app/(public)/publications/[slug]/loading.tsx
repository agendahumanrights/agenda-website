import { DetailSkeleton } from "@/components/ui/Skeleton";

export default function PublicationDetailLoading() {
  return (
    <div className="public-main-offset pb-16">
      <DetailSkeleton />
    </div>
  );
}
