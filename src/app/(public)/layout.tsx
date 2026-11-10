import { Suspense } from "react";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";

async function PublicChrome({ children }: { children: React.ReactNode }) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  return (
    <>
      <SiteHeader locale={locale} dict={dict} />
      <main className="flex-1">{children}</main>
      <SiteFooter locale={locale} dict={dict} />
    </>
  );
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="public-main-offset">
          <LoadingState />
        </div>
      }
    >
      <PublicChrome>{children}</PublicChrome>
    </Suspense>
  );
}
