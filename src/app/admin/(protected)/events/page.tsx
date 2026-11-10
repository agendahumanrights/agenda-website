import Link from "next/link";
import { Suspense } from "react";

import { EventsTable } from "@/components/admin/EventsTable";
import { LoadingState } from "@/components/ui/LoadingState";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { parseWithSchema } from "@/server/http/parse";
import { listAdminEvents } from "@/server/services/events";
import { adminEventListQuerySchema } from "@/server/validations/events";

async function EventsList({
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
  const query = parseWithSchema(adminEventListQuerySchema, {
    ...flat,
    locale,
  });
  const initial = await listAdminEvents(query);

  return (
    <EventsTable
      locale={locale}
      labels={dict.admin.evt}
      shared={dict.shared}
      initial={initial}
    />
  );
}

export default async function AdminEventsPage({
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
            {dict.admin.events}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-[var(--admin-muted)]">
            {dict.admin.evt.listSubtitle}
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--brand-blue)] bg-[var(--brand-blue)] px-4 text-sm font-medium text-white hover:bg-[#043a70]"
        >
          <span aria-hidden className="text-lg leading-none">
            +
          </span>
          {dict.admin.evt.add}
        </Link>
      </div>
      <Suspense fallback={<LoadingState />}>
        <EventsList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
