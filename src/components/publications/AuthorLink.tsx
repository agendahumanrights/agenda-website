import Link from "next/link";

import type { Locale } from "@/i18n/config";
import { sitePath } from "@/i18n/pathnames";
import { cn } from "@/lib/utils";

type Props = {
  /** Writer public slug → /writers/{slug} */
  slug: string;
  name: string;
  locale?: Locale;
  className?: string;
};

/** Navigates to the writer's public profile page. */
export function AuthorLink({ slug, name, locale, className }: Props) {
  return (
    <Link
      href={sitePath(`/writers/${slug}`, locale)}
      className={cn("underline-offset-2 hover:underline", className)}
    >
      {name}
    </Link>
  );
}
