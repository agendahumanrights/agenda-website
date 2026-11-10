type Props = {
  title: string;
  subtitle?: string;
};

export function PageHeading({ title, subtitle }: Props) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="font-editorial text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="max-w-2xl text-base text-[var(--brand-gray)] sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
