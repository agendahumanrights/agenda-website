type Props = {
  title: string;
  description?: string;
};

export function AdminPageHeader({ title, description }: Props) {
  return (
    <header className="mb-6 flex flex-col gap-1">
      <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
      {description ? <p className="text-sm text-zinc-600">{description}</p> : null}
    </header>
  );
}
