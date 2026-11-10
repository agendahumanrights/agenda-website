type Props = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: Props) {
  return (
    <div
      role="status"
      className="flex flex-col items-start gap-2 border border-dashed border-zinc-300 p-6"
    >
      <p className="text-base font-medium text-zinc-900">{title}</p>
      {description ? (
        <p className="text-sm text-zinc-600">{description}</p>
      ) : null}
    </div>
  );
}
