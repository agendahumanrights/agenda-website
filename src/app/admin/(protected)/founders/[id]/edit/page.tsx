import { notFound } from "next/navigation";

import { FounderForm } from "@/components/admin/FounderForm";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { AppError } from "@/server/http/errors";
import { getAdminFounderById } from "@/server/services/founders";
import { MEDIA_LIMITS } from "@/server/storage/limits";

export default async function AdminEditFounderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  let founder;
  try {
    founder = await getAdminFounderById(id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }

  return (
    <FounderForm
      mode="edit"
      labels={dict.admin.founder}
      locale={locale}
      initial={founder}
      mediaLimits={{ maxImageBytes: MEDIA_LIMITS.maxImageBytes }}
    />
  );
}
