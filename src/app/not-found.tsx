import Link from "next/link";

import { sitePath } from "@/i18n/pathnames";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-24">
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="text-zinc-600">Page not found. / الصفحة غير موجودة.</p>
      <Link
        href={sitePath("/")}
        className="text-sm font-medium underline-offset-2 hover:underline"
      >
        Home / الرئيسية
      </Link>
    </main>
  );
}
