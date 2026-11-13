import { EventForm } from "@/components/admin/EventForm";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { MEDIA_LIMITS } from "@/server/storage/limits";


/** Admin routes read cookies/session — allow blocking navigations. */
export const instant = false;

export default async function AdminNewEventPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  return (
    <EventForm
      mode="create"
      labels={dict.admin.evt}
      markdownLabels={dict.admin.markdown}
      locale={locale}
      mediaLimits={{
        maxImageBytes: MEDIA_LIMITS.maxImageBytes,
        maxImagesPerItem: MEDIA_LIMITS.maxImagesPerItem,
        maxGalleryImages: MEDIA_LIMITS.maxGalleryImages,
      }}
    />
  );
}
