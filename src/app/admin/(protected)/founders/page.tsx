import Link from "next/link";
import { Suspense } from "react";

import { FoundersTable } from "@/components/admin/FoundersTable";
import { LoadingState } from "@/components/ui/LoadingState";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { parseWithSchema } from "@/server/http/parse";
import {
  listAdminFounders,
  listAllAdminFoundersOrdered,
} from "@/server/services/founders";
import { adminFounderListQuerySchema } from "@/server/validations/founders";


/** Admin routes read cookies/session — allow blocking navigations. */
export const instant = false;
async function FoundersList({
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
  const query = parseWithSchema(adminFounderListQuerySchema, {
    ...flat,
    locale,
  });
  const [initial, orderList] = await Promise.all([
    listAdminFounders(query),
    listAllAdminFoundersOrdered(locale),
  ]);

  return (
    <FoundersTable
      key={orderList.map((i) => `${i.id}:${i.sortOrder}`).join(",")}
      locale={locale}
      labels={dict.admin.founder}
      shared={dict.shared}
      initial={initial}
      orderInitial={orderList}
    />
  );
}

export default async function AdminFoundersPage({
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
            {dict.admin.founders}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-[var(--admin-muted)]">
            {dict.admin.founder.listSubtitle}
          </p>
        </div>
        <Link
          href="/admin/founders/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--brand-blue)] bg-[var(--brand-blue)] px-4 text-sm font-medium text-white hover:bg-[#043a70]"
        >
          <span aria-hidden className="text-lg leading-none">
            +
          </span>
          {dict.admin.founder.add}
        </Link>
      </div>
      <Suspense fallback={<LoadingState />}>
        <FoundersList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
