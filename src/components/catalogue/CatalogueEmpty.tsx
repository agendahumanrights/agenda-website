import Link from "next/link";

import { EmptyState } from "@/components/ui/EmptyState";

type Props = {
  title: string;
  description?: string;
  clearLabel?: string;
  clearHref?: string;
  retryLabel?: string;
  retryHref?: string;
};

export function CatalogueEmpty({
  title,
  description,
  clearLabel,
  clearHref,
  retryLabel,
  retryHref,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <EmptyState title={title} description={description} />
      <div className="flex flex-wrap gap-3">
        {clearHref && clearLabel ? (
          <Link
            href={clearHref}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--brand-blue)] bg-[var(--brand-blue)] px-4 text-sm font-medium text-white hover:bg-[#043a70] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]"
          >
            {clearLabel}
          </Link>
        ) : null}
        {retryHref && retryLabel ? (
          <Link
            href={retryHref}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)]"
          >
            {retryLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
