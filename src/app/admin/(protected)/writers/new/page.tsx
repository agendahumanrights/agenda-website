import { WriterForm } from "@/components/admin/WriterForm";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { MEDIA_LIMITS } from "@/server/storage/limits";

/** Admin routes read cookies/session — allow blocking navigations. */
export const instant = false;

export default async function AdminNewWriterPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  return (
    <WriterForm
      mode="create"
      labels={dict.admin.writer}
      markdownLabels={dict.admin.markdown}
      locale={locale}
      mediaLimits={{ maxImageBytes: MEDIA_LIMITS.maxImageBytes }}
    />
  );
}