import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { DetailSkeleton } from "@/components/ui/Skeleton";
import { WriterProfile } from "@/components/writers/WriterProfile";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { sitePath } from "@/i18n/pathnames";
import { breadcrumbJsonLd, personJsonLd } from "@/lib/seo/json-ld";
import { absoluteLocalizedUrl } from "@/lib/seo/locale-url";
import { writerProfileMetadata } from "@/lib/seo/page-metadata";
import { isDatabaseConfigured } from "@/server/db";
import { AppError } from "@/server/http/errors";
import { getWriterBySlug } from "@/server/services/writers";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  if (!isDatabaseConfigured()) {
    return { title: dict.writers.notFoundTitle, robots: { index: false } };
  }

  try {
    const writer = await getWriterBySlug(slug, locale);
    return writerProfileMetadata({
      locale,
      siteName: dict.meta.siteName,
      writer,
    });
  } catch {
    return { title: dict.writers.notFoundTitle, robots: { index: false } };
  }
}

async function WriterProfileContent({ params }: { params: Params }) {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  if (!isDatabaseConfigured()) {
    notFound();
  }

  let writer;
  try {
    writer = await getWriterBySlug(slug, locale);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const pageUrl = absoluteLocalizedUrl(`/writers/${writer.slug}`, locale);

  return (
    <div className="public-main-offset bg-[color-mix(in_srgb,var(--brand-blue)_2.5%,white)]">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            {
              name: dict.nav.home,
              url: absoluteLocalizedUrl("/", locale),
            },
            { name: writer.fullName, url: pageUrl },
          ]),
          personJsonLd({
            name: writer.fullName,
            url: pageUrl,
            imageUrl: writer.profileImageUrl,
            jobTitle: writer.major,
            email: writer.email,
            sameAs: writer.socialLinks.map((l) => l.url),
            description: writer.biography.trim() || null,
          }),
        ]}
      />
      <Container className="pb-10 pt-6 sm:pb-14 sm:pt-8 lg:pb-16 lg:pt-10">
        <nav
          aria-label={dict.writers.breadcrumbNav}
          className="mb-5 text-sm text-[var(--brand-gray)] sm:mb-6"
        >
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <a
                href={sitePath("/", locale)}
                className="hover:text-[var(--brand-blue)] hover:underline"
              >
                {dict.nav.home}
              </a>
            </li>
            <li aria-hidden>/</li>
            <li className="font-medium text-[var(--brand-blue)]">
              {writer.fullName}
            </li>
          </ol>
        </nav>
        <WriterProfile writer={writer} labels={dict.writers} locale={locale} />
      </Container>
    </div>
  );
}

export default function WriterProfilePage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <div className="public-main-offset pb-16">
          <DetailSkeleton />
        </div>
      }
    >
      <WriterProfileContent params={params} />
    </Suspense>
  );
}
