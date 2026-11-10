import { BrandedStatusPage } from "@/components/ui/BrandedStatusPage";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { localeDirection } from "@/i18n/config";
import { sitePath } from "@/i18n/pathnames";

export default async function NotFound() {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  return (
    <BrandedStatusPage
      code="404"
      title={dict.shared.notFoundTitle}
      body={dict.shared.notFoundBody}
      dir={localeDirection(locale)}
      lang={locale}
      actions={[
        {
          href: sitePath("/", locale),
          label: dict.shared.notFoundHome,
          primary: true,
        },
        {
          href: sitePath("/publications", locale),
          label: dict.shared.notFoundPublications,
        },
        {
          href: sitePath("/events", locale),
          label: dict.shared.notFoundEvents,
        },
      ]}
    />
  );
}
