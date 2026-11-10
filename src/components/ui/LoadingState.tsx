type Props = {
  label?: string;
};

export function LoadingState({ label = "Loading…" }: Props) {
  return (
    <div role="status" aria-live="polite" className="p-6 text-sm text-zinc-600">
      {label}
    </div>
  );
}
