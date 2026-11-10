import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { AdminUnavailable } from "@/components/shared/AdminUnavailable";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { getAdminSession } from "@/server/auth";
import { safeAdminNextPath } from "@/server/auth/redirects";
import { isDatabaseConfigured } from "@/server/db";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const headerList = await headers();
  const pathname = headerList.get("x-agenda-pathname") || "/admin";

  if (!isDatabaseConfigured()) {
    return <AdminUnavailable labels={dict.admin} />;
  }

  const auth = await getAdminSession();
  if (!auth.authenticated) {
    const next = safeAdminNextPath(pathname);
    redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  }

  return (
    <AdminShell locale={locale} dict={dict} admin={auth.session}>
      {children}
    </AdminShell>
  );
}
