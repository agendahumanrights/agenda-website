type Props = {
  title: string;
  description?: string;
};

export function ErrorState({ title, description }: Props) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-2 border border-red-200 bg-red-50 p-6 text-red-900"
    >
      <p className="font-medium">{title}</p>
      {description ? <p className="text-sm">{description}</p> : null}
    </div>
  );
}
