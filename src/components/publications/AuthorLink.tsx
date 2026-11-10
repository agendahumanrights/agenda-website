import Link from "next/link";

import type { Locale } from "@/i18n/config";
import { sitePath } from "@/i18n/pathnames";
import { cn } from "@/lib/utils";

type Props = {
  bioKey: string;
  name: string;
  locale?: Locale;
  className?: string;
};

/** Always navigates to the founder biography section on About Us. */
export function AuthorLink({ bioKey, name, locale, className }: Props) {
  return (
    <Link
      href={`${sitePath("/about", locale)}#founder-${bioKey}`}
      className={cn("underline-offset-2 hover:underline", className)}
    >
      {name}
    </Link>
  );
}
