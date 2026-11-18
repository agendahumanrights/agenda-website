import { notFound } from "next/navigation";

import { WriterForm } from "@/components/admin/WriterForm";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { AppError } from "@/server/http/errors";
import { getAdminWriterById } from "@/server/services/writers";
import { MEDIA_LIMITS } from "@/server/storage/limits";

/** Admin routes read cookies/session — allow blocking navigations. */
export const instant = false;

export default async function AdminEditWriterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  let writer;
  try {
    writer = await getAdminWriterById(id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }

  return (
    <WriterForm
      mode="edit"
      labels={dict.admin.writer}
      markdownLabels={dict.admin.markdown}
      locale={locale}
      initial={writer}
      mediaLimits={{ maxImageBytes: MEDIA_LIMITS.maxImageBytes }}
    />
  );
}