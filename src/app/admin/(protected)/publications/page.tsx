import Link from "next/link";
import { Suspense } from "react";

import { PublicationsTable } from "@/components/admin/PublicationsTable";
import { LoadingState } from "@/components/ui/LoadingState";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { parseWithSchema } from "@/server/http/parse";
import { listPublicationCategories } from "@/server/services/categories";
import { listAdminPublications } from "@/server/services/publications";
import { adminPublicationListQuerySchema } from "@/server/validations/publications";


/** Admin routes read cookies/session — allow blocking navigations. */
export const instant = false;
async function PublicationsList({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const raw = await searchParams;
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") flat[key] = value;
    else if (Array.isArray(value) && value[0]) flat[key] = value[0];
  }
  const query = parseWithSchema(adminPublicationListQuerySchema, {
    ...flat,
    locale,
  });
  const [initial, categories] = await Promise.all([
    listAdminPublications(query),
    listPublicationCategories(locale),
  ]);

  return (
    <PublicationsTable
      locale={locale}
      labels={dict.admin.pub}
      categories={categories}
      shared={dict.shared}
      initial={initial}
    />
  );
}

export default async function AdminPublicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[1.75rem]">
            {dict.admin.publications}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-[var(--admin-muted)]">
            {dict.admin.pub.listSubtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/publications/categories"
            className="inline-flex min-h-11 items-center rounded-lg border border-[var(--admin-border)] bg-white px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            {dict.admin.pub.manageCategories}
          </Link>
          <Link
            href="/admin/publications/new"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--brand-blue)] bg-[var(--brand-blue)] px-4 text-sm font-medium text-white hover:bg-[#043a70]"
          >
            <span aria-hidden className="text-lg leading-none">
              +
            </span>
            {dict.admin.pub.add}
          </Link>
        </div>
      </div>
      <Suspense fallback={<LoadingState />}>
        <PublicationsList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
