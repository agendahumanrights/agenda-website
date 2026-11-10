"use client";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LocaleError({ error, reset }: Props) {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-24">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-zinc-600">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="w-fit rounded border border-zinc-300 px-3 py-2 text-sm"
      >
        Try again
      </button>
    </main>
  );
}
