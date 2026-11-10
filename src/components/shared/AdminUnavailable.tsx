import Link from "next/link";

import { ErrorState } from "@/components/ui/ErrorState";
import { sitePath } from "@/i18n/pathnames";
import type { Dictionary } from "@/i18n/dictionaries";

type Props = {
  labels: Dictionary["admin"];
};

export function AdminUnavailable({ labels }: Props) {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-8">
      <ErrorState
        title={labels.unavailable}
        description={labels.unavailableBody}
      />
      <Link
        href={sitePath("/")}
        className="text-sm font-medium underline-offset-2 hover:underline"
      >
        {labels.backToSite}
      </Link>
    </div>
  );
}
