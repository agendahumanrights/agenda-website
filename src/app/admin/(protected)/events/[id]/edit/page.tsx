import { notFound } from "next/navigation";

import { EventForm } from "@/components/admin/EventForm";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { AppError } from "@/server/http/errors";
import { getAdminEventById } from "@/server/services/events";
import { MEDIA_LIMITS } from "@/server/storage/limits";

export default async function AdminEditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  let event;
  try {
    event = await getAdminEventById(id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }

  return (
    <EventForm
      mode="edit"
      labels={dict.admin.evt}
      markdownLabels={dict.admin.markdown}
      locale={locale}
      mediaLimits={{
        maxImageBytes: MEDIA_LIMITS.maxImageBytes,
        maxImagesPerItem: MEDIA_LIMITS.maxImagesPerItem,
        maxGalleryImages: MEDIA_LIMITS.maxGalleryImages,
      }}
      initial={event}
    />
  );
}
