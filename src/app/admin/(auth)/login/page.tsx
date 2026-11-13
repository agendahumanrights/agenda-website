import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";

import { LoginForm } from "@/components/admin/LoginForm";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { sitePath } from "@/i18n/pathnames";
import { getAdminSession } from "@/server/auth";
import { safeAdminNextPath } from "@/server/auth/redirects";
import { isDatabaseConfigured } from "@/server/db";

/** Login reads the session cookie and may redirect — not an instant route. */
export const instant = false;

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <AdminLoginContent searchParams={searchParams} />
    </Suspense>
  );
}

function LoginPageFallback() {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-6 px-4 py-24">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </main>
  );
}

async function AdminLoginContent({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const params = await searchParams;
  const nextPath = safeAdminNextPath(params.next);

  if (!isDatabaseConfigured()) {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col gap-6 px-4 py-24">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">{dict.admin.login}</h1>
          <Suspense fallback={null}>
            <LanguageSwitcher locale={locale} label={dict.nav.language} />
          </Suspense>
        </div>
        <ErrorState
          title={dict.admin.unavailable}
          description={dict.admin.unavailableBody}
        />
        <Link
          href={sitePath("/")}
          className="text-sm font-medium underline-offset-2 hover:underline"
        >
          {dict.admin.backToSite}
        </Link>
      </main>
    );
  }

  const auth = await getAdminSession();
  if (auth.authenticated) {
    redirect(nextPath);
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-6 px-4 py-24">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{dict.admin.title}</h1>
          <p className="mt-1 text-sm text-zinc-600">{dict.admin.loginSubtitle}</p>
        </div>
        <Suspense fallback={null}>
          <LanguageSwitcher locale={locale} label={dict.nav.language} />
        </Suspense>
      </div>
      <h2 className="sr-only">{dict.admin.login}</h2>
      <LoginForm labels={dict.admin} nextPath={nextPath} />
    </main>
  );
}
