import { notFound } from "next/navigation";

import { PublicationForm } from "@/components/admin/PublicationForm";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { AppError } from "@/server/http/errors";
import { listPublicationCategories } from "@/server/services/categories";
import { listFounders } from "@/server/services/founders";
import { getAdminPublicationById } from "@/server/services/publications";
import { MEDIA_LIMITS } from "@/server/storage/limits";


/** Admin routes read cookies/session — allow blocking navigations. */
export const instant = false;

export default async function AdminEditPublicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  let publication;
  try {
    publication = await getAdminPublicationById(id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }

  const [founders, categories] = await Promise.all([
    listFounders(locale),
    listPublicationCategories(locale),
  ]);

  return (
    <PublicationForm
      mode="edit"
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
      initial={publication}
    />
  );
}
