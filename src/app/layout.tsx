import type { Metadata, Viewport } from "next";
import {
  Cairo,
  Geist,
  Geist_Mono,
  IBM_Plex_Sans_Arabic,
  Source_Serif_4,
} from "next/font/google";

import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { localeDirection } from "@/i18n/config";
import { getSiteUrl, isNonProductionIndexing } from "@/lib/seo/site-url";

import "./globals.css";

/**
 * Cookie/query-driven `lang` / `dir` cannot sit behind Suspense on `<html>`.
 * Allow this layout to block so the first HTML paint matches the visitor's language.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/instant
 */
export const instant = false;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

/** Arabic headings (H1–H3 / `.font-editorial`) — loaded only for `ar`. */
const cairoArabic = Cairo({
  variable: "--font-arabic-heading",
  subsets: ["arabic"],
  weight: ["600", "700"],
  display: "swap",
});

/** Arabic body / UI — loaded only for `ar`. */
const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic-body",
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#05498c",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const noIndex = isNonProductionIndexing();

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: dict.meta.siteName,
      template: `%s | ${dict.meta.siteName}`,
    },
    description: dict.meta.siteDescription,
    applicationName: dict.meta.siteName,
    // Icons come from App Router file conventions: favicon.ico, icon0.svg,
    // icon1.png, apple-icon.png, plus web-app-manifest PNGs via manifest.ts.
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getRequestLocale();
  const dir = localeDirection(locale);

  const fontClasses = [
    geistSans.variable,
    geistMono.variable,
    sourceSerif.variable,
    // Arabic faces only when needed (English keeps Geist + Source Serif).
    locale === "ar" ? cairoArabic.variable : null,
    locale === "ar" ? ibmPlexSansArabic.variable : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${fontClasses} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
