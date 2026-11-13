import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EventDetails } from "@/components/events/EventDetails";
import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import {
  breadcrumbJsonLd,
  eventJsonLd,
} from "@/lib/seo/json-ld";
import { absoluteLocalizedUrl } from "@/lib/seo/locale-url";
import { eventDetailMetadata } from "@/lib/seo/page-metadata";
import { isDatabaseConfigured } from "@/server/db";
import { AppError } from "@/server/http/errors";
import { getPublishedEventBySlug } from "@/server/services/events";
import { getEventLocalesForSlug } from "@/server/services/seo-sitemap";

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
    return { title: dict.events.title, robots: { index: false } };
  }

  try {
    const [event, availableLocales] = await Promise.all([
      getPublishedEventBySlug(locale, slug),
      getEventLocalesForSlug(slug),
    ]);
    return eventDetailMetadata({
      locale,
      siteName: dict.meta.siteName,
      event,
      availableLocales:
        availableLocales.length > 0 ? availableLocales : [locale],
    });
  } catch {
    return { title: dict.events.title, robots: { index: false } };
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);

  if (!isDatabaseConfigured()) {
    return (
      <div className="public-main-offset min-h-[50vh] bg-white">
        <Container className="pb-10 sm:pb-12">
          <EmptyState
            title={dict.events.title}
            description={dict.events.detailsPlaceholder}
          />
        </Container>
      </div>
    );
  }

  let event;
  try {
    event = await getPublishedEventBySlug(locale, slug);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const pageUrl = absoluteLocalizedUrl(`/events/${event.slug}`, locale);
  const description = event.subtitle?.trim() || event.title;

  return (
    <div className="public-main-offset bg-white">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            {
              name: dict.nav.home,
              url: absoluteLocalizedUrl("/", locale),
            },
            {
              name: dict.events.title,
              url: absoluteLocalizedUrl("/events", locale),
            },
            { name: event.title, url: pageUrl },
          ]),
          eventJsonLd({
            locale,
            siteName: dict.meta.siteName,
            name: event.title,
            description,
            url: pageUrl,
            eventDate: event.eventDate,
            imageUrl: event.mainImageUrl,
          }),
        ]}
      />
      <Container className="pb-12 sm:pb-16 lg:pb-20">
        <EventDetails
          locale={locale}
          event={event}
          labels={dict.events}
          shared={dict.shared}
          navHome={dict.nav.home}
        />
      </Container>
    </div>
  );
}
