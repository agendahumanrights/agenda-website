import { Suspense } from "react";

import { NewsletterSubscribersTable } from "@/components/admin/NewsletterSubscribersTable";
import { LoadingState } from "@/components/ui/LoadingState";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { parseWithSchema } from "@/server/http/parse";
import { listAdminNewsletterSubscribers } from "@/server/services/newsletter";
import { adminNewsletterListQuerySchema } from "@/server/validations/newsletter";

/** Admin routes read cookies/session — allow blocking navigations. */
export const instant = false;

async function NewsletterList({
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
  const query = parseWithSchema(adminNewsletterListQuerySchema, flat);
  const initial = await listAdminNewsletterSubscribers(query);

  return (
    <NewsletterSubscribersTable
      locale={locale}
      labels={dict.admin.newsletterAdmin}
      shared={dict.shared}
      initial={initial}
    />
  );
}

export default async function AdminNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  return (
    <div className="flex flex-col gap-6">
      <div className="min-w-0 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[1.75rem]">
          {dict.admin.newsletter}
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-[var(--admin-muted)]">
          {dict.admin.newsletterAdmin.listSubtitle}
        </p>
      </div>
      <Suspense fallback={<LoadingState />}>
        <NewsletterList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
