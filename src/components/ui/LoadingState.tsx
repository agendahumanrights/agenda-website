import { Skeleton } from "@/components/ui/Skeleton";

type Props = {
  label?: string;
};

/** Compact inline loading indicator (catalogue overlays, small panels). */
export function LoadingState({ label = "Loading…" }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 p-6 text-sm text-[var(--brand-gray)]"
    >
      <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
      <span>{label}</span>
    </div>
  );
}
