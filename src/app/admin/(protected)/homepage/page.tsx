import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { HomepageSelection } from "@/components/admin/HomepageSelection";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { getAdminHomepageSelectionState } from "@/server/services/homepage";


/** Admin routes read cookies/session — allow blocking navigations. */
export const instant = false;

export default async function AdminHomepagePage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  let state: Awaited<ReturnType<typeof getAdminHomepageSelectionState>> | null =
    null;
  let loadError = false;
  try {
    state = await getAdminHomepageSelectionState(locale);
  } catch {
    loadError = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={dict.admin.homepageAdmin.title}
        description={dict.admin.homepageAdmin.description}
      />
      <HomepageSelection
        locale={locale}
        labels={dict.admin.homepageAdmin}
        categoryLabels={dict.publications}
        publications={
          state?.publications ?? { selected: [], available: [] }
        }
        events={
          state?.events ?? { selected: [], available: [], max: 3 }
        }
        initialLoadError={loadError}
      />
    </div>
  );
}
