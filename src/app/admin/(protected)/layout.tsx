import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { AdminUnavailable } from "@/components/shared/AdminUnavailable";
import { AdminTableSkeleton } from "@/components/ui/Skeleton";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { getAdminSession } from "@/server/auth";
import { safeAdminNextPath } from "@/server/auth/redirects";
import { isDatabaseConfigured } from "@/server/db";

/**
 * Auth gate + shell are request-time. Allow blocking navigations into protected admin.
 * Session read streams behind Suspense so a fallback can paint first.
 */
export const instant = false;

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AdminProtectedFallback />}>
      <AdminProtectedGate>{children}</AdminProtectedGate>
    </Suspense>
  );
}

function AdminProtectedFallback() {
  return (
    <div className="p-6">
      <AdminTableSkeleton rows={8} />
    </div>
  );
}

async function AdminProtectedGate({
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
