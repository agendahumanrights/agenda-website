import { AdminTableSkeleton } from "@/components/ui/Skeleton";

export default function AdminLoading() {
  return (
    <div className="p-6">
      <AdminTableSkeleton rows={8} />
    </div>
  );
}