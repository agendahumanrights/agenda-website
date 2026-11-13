import { PublicationForm } from "@/components/admin/PublicationForm";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { listPublicationCategories } from "@/server/services/categories";
import { listFounders } from "@/server/services/founders";
import { MEDIA_LIMITS } from "@/server/storage/limits";


/** Admin routes read cookies/session — allow blocking navigations. */
export const instant = false;

export default async function AdminNewPublicationPage() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const [founders, categories] = await Promise.all([
    listFounders(locale),
    listPublicationCategories(locale),
  ]);

  return (
    <PublicationForm
      mode="create"
      locale={locale}
      labels={dict.admin.pub}
      markdownLabels={dict.admin.markdown}
      founders={founders.map((f) => ({ id: f.id, fullName: f.fullName }))}
      categories={categories}
      mediaLimits={{
        maxImageBytes: MEDIA_LIMITS.maxImageBytes,
        maxPdfBytes: MEDIA_LIMITS.maxPdfBytes,
        maxImagesPerItem: MEDIA_LIMITS.maxImagesPerItem,
        maxGalleryImages: MEDIA_LIMITS.maxGalleryImages,
      }}
    />
  );
}
