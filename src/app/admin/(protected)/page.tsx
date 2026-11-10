import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { getAdminSession } from "@/server/auth";

export default async function AdminDashboardPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const auth = await getAdminSession();
  const name =
    auth.authenticated && auth.session.name?.trim()
      ? auth.session.name
      : auth.authenticated
        ? auth.session.email
        : "";

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        title={dict.admin.dashboard}
        description={`${dict.admin.welcome}${name ? `, ${name}` : ""}.`}
      />
      <p className="max-w-2xl text-sm text-zinc-700">{dict.admin.dashboardIntro}</p>
    </div>
  );
}
