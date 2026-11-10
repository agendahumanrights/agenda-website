import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/LoginForm";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { getAdminSession } from "@/server/auth";
import { safeAdminNextPath } from "@/server/auth/redirects";
import { isDatabaseConfigured } from "@/server/db";
import { ErrorState } from "@/components/ui/ErrorState";
import Link from "next/link";
import { sitePath } from "@/i18n/pathnames";

export default async function AdminLoginPage({
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
          <LanguageSwitcher locale={locale} label={dict.nav.language} />
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
        <LanguageSwitcher locale={locale} label={dict.nav.language} />
      </div>
      <h2 className="sr-only">{dict.admin.login}</h2>
      <LoginForm labels={dict.admin} nextPath={nextPath} />
    </main>
  );
}
