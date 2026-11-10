import { FounderForm } from "@/components/admin/FounderForm";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { MEDIA_LIMITS } from "@/server/storage/limits";

export default async function AdminNewFounderPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  return (
    <FounderForm
      mode="create"
      labels={dict.admin.founder}
      locale={locale}
      mediaLimits={{ maxImageBytes: MEDIA_LIMITS.maxImageBytes }}
    />
  );
}
