import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogueEmpty } from "@/components/catalogue/CatalogueEmpty";
import {
  CatalogueLiveProvider,
  CatalogueResultsFrame,
} from "@/components/catalogue/CatalogueLiveContext";
import { CatalogueResultsBar } from "@/components/catalogue/CatalogueResultsBar";
import { EventDateFilter } from "@/components/events/EventDateFilter";
import { EventGrid } from "@/components/events/EventGrid";
import { Container } from "@/components/layout/Container";
import { PageHero } from "@/components/layout/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { Pagination } from "@/components/ui/Pagination";
import { PAGE_HEROES } from "@/content/page-heroes";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import { sitePath } from "@/i18n/pathnames";
import {
  buildEventCatalogueHref,
  clampCataloguePage,
  parseEventCatalogueParams,
} from "@/lib/catalogue-query";
import { formatResultsSummary } from "@/lib/catalogue-summary";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { absoluteLocalizedUrl } from "@/lib/seo/locale-url";
import { eventsListingMetadata } from "@/lib/seo/page-metadata";
import { isDatabaseConfigured } from "@/server/db";
import { listPublishedEvents } from "@/server/services/events";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const locale = await getRequestLocale();
  const applied = parseEventCatalogueParams(await searchParams);
  return eventsListingMetadata(locale, applied);
}

function ResultsPending({ label }: { label: string }) {
  return (
    <div
      className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-10 text-center text-sm text-zinc-500"
      role="status"
      aria-live="polite"
    >
      {label}
    </div>
  );
}

async function EventsResults({
  locale,
  dict,
  applied,
}: {
  locale: Locale;
  dict: Dictionary;
  applied: ReturnType<typeof parseEventCatalogueParams>;
}) {
  const hasFilters = Boolean(applied.q);
  const clearHref = buildEventCatalogueHref({ locale });
  const currentHref = buildEventCatalogueHref({
    q: applied.q,
    sort: applied.sort,
    page: applied.page,
    locale,
  });

  if (!isDatabaseConfigured()) {
    return (
      <CatalogueEmpty
        title={dict.catalogue.unavailable}
        description={dict.catalogue.unavailableBody}
      />
    );
  }

  let result;
  try {
    result = await listPublishedEvents({
      locale,
      page: applied.page,
      pageSize: applied.pageSize,
      q: applied.q,
      sort: applied.sort,
    });
  } catch {
    return (
      <CatalogueEmpty
        title={dict.catalogue.loadError}
        description={dict.catalogue.loadErrorBody}
        retryLabel={dict.catalogue.retry}
        retryHref={currentHref}
      />
    );
  }

  const totalPages = result.pagination.totalPages;
  const page = clampCataloguePage(applied.page, totalPages || 1);

  if (page !== applied.page && totalPages > 0) {
    result = await listPublishedEvents({
      locale,
      page,
      pageSize: applied.pageSize,
      q: applied.q,
      sort: applied.sort,
    });
  }

  const summaryTemplate = hasFilters
    ? dict.events.resultsSummaryFiltered
    : dict.events.resultsSummary;
  const summary = formatResultsSummary(summaryTemplate, {
    page: result.pagination.page,
    pageSize: result.pagination.pageSize,
    total: result.pagination.total,
  });

  const chips = applied.q
    ? [
        {
          id: "q",
          label: `${dict.events.searchChip}: “${applied.q}”`,
          removeHref: buildEventCatalogueHref({
            sort: applied.sort,
            page: 1,
            locale,
          }),
        },
      ]
    : [];

  if (result.pagination.total === 0) {
    return (
      <div className="flex flex-col gap-4">
        <CatalogueResultsBar
          labels={dict.catalogue}
          summary={summary}
          chips={chips}
          clearAllHref={clearHref}
          hasActiveFilters={hasFilters}
        />
        <CatalogueEmpty
          title={
            hasFilters ? dict.events.noMatches : dict.events.emptyCatalogue
          }
          description={
            hasFilters
              ? dict.events.noMatchesBody
              : dict.events.emptyCatalogueBody
          }
          clearLabel={hasFilters ? dict.catalogue.clearFilters : undefined}
          clearHref={hasFilters ? clearHref : undefined}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <CatalogueResultsBar
        labels={dict.catalogue}
        summary={summary}
        chips={chips}
        clearAllHref={clearHref}
        hasActiveFilters={hasFilters}
      />
      <EventGrid
        locale={locale}
        items={result.items}
        emptyLabel={dict.events.empty}
        readMoreLabel={dict.events.readMore}
        badgeLabel={dict.events.categoryEvent}
      />
      <Pagination
        page={result.pagination.page}
        totalPages={result.pagination.totalPages}
        previousLabel={dict.catalogue.previous}
        nextLabel={dict.catalogue.next}
        pageOfLabel={dict.catalogue.pageOf}
        hrefForPage={(nextPage) =>
          buildEventCatalogueHref({
            q: applied.q,
            sort: applied.sort,
            page: nextPage,
            locale,
          })
        }
      />
    </div>
  );
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const raw = await searchParams;
  const applied = parseEventCatalogueParams(raw);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          {
            name: dict.nav.home,
            url: absoluteLocalizedUrl("/", locale),
          },
          {
            name: dict.events.title,
            url: absoluteLocalizedUrl("/events", locale),
          },
        ])}
      />
      <PageHero
        title={dict.events.title}
        description={dict.events.heroDescription}
        image={PAGE_HEROES.events}
        breadcrumbLabel={dict.shared.breadcrumbNav}
        breadcrumbs={[
          { label: dict.nav.home, href: sitePath("/", locale) },
          { label: dict.events.title },
        ]}
      />
      <Container className="flex flex-col gap-6 pt-10 pb-10 sm:gap-7 sm:pt-12 sm:pb-12 lg:pt-14">
        <CatalogueLiveProvider>
          <div className="flex flex-col gap-6">
            <EventDateFilter
              locale={locale}
              labels={dict.events}
              catalogueLabels={dict.catalogue}
              applied={{ q: applied.q, sort: applied.sort }}
            />
            <CatalogueResultsFrame loadingLabel={dict.catalogue.loading}>
              <Suspense
                fallback={<ResultsPending label={dict.catalogue.loading} />}
              >
                <EventsResults locale={locale} dict={dict} applied={applied} />
              </Suspense>
            </CatalogueResultsFrame>
          </div>
        </CatalogueLiveProvider>
      </Container>
    </>
  );
}
