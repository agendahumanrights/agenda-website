import { Suspense } from "react";

import { CategoriesTable } from "@/components/admin/CategoriesTable";
import { LoadingState } from "@/components/ui/LoadingState";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { parseWithSchema } from "@/server/http/parse";
import { listAdminPublicationCategories } from "@/server/services/categories";
import { adminPublicationCategoryListQuerySchema } from "@/server/validations/categories";

async function CategoriesList({
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
  const query = parseWithSchema(adminPublicationCategoryListQuerySchema, {
    ...flat,
    locale,
  });
  const initial = await listAdminPublicationCategories(query);

  return (
    <CategoriesTable
      labels={dict.admin.pubCategories}
      shared={dict.shared}
      initial={initial}
    />
  );
}

export default async function AdminPublicationCategoriesPage({
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
          {dict.admin.pubCategories.title}
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-[var(--admin-muted)]">
          {dict.admin.pubCategories.subtitle}
        </p>
      </div>
      <Suspense fallback={<LoadingState />}>
        <CategoriesList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
