import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogueEmpty } from "@/components/catalogue/CatalogueEmpty";
import {
  CatalogueLiveProvider,
  CatalogueResultsFrame,
} from "@/components/catalogue/CatalogueLiveContext";
import { CatalogueResultsBar } from "@/components/catalogue/CatalogueResultsBar";
import { PublicationGrid } from "@/components/home/PublicationGrid";
import { Container } from "@/components/layout/Container";
import { PageHero } from "@/components/layout/PageHero";
import { PublicationFilters } from "@/components/publications/PublicationFilters";
import { JsonLd } from "@/components/seo/JsonLd";
import { Pagination } from "@/components/ui/Pagination";
import { PAGE_HEROES } from "@/content/page-heroes";
import { getDictionary } from "@/i18n/get-dictionary";
import { getRequestLocale } from "@/i18n/get-locale";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { sitePath } from "@/i18n/pathnames";
import {
  buildPublicationCatalogueHref,
  clampCataloguePage,
  parsePublicationCatalogueParams,
} from "@/lib/catalogue-query";
import { formatResultsSummary } from "@/lib/catalogue-summary";
import { absoluteLocalizedUrl } from "@/lib/seo/locale-url";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { publicationsListingMetadata } from "@/lib/seo/page-metadata";
import { isDatabaseConfigured } from "@/server/db";
import { listPublicationCategories } from "@/server/services/categories";
import { listPublishedPublications } from "@/server/services/publications";
import type { PublicationCategorySummary } from "@/types/publication";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const locale = await getRequestLocale();
  const applied = parsePublicationCatalogueParams(await searchParams);
  return publicationsListingMetadata(locale, applied);
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

async function PublicationsResults({
  locale,
  dict,
  applied,
  categories,
}: {
  locale: Locale;
  dict: Dictionary;
  applied: ReturnType<typeof parsePublicationCatalogueParams>;
  categories: PublicationCategorySummary[];
}) {
  const hasFilters = Boolean(applied.q || applied.category);
  const clearHref = buildPublicationCatalogueHref({ locale });

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
    result = await listPublishedPublications({
      locale,
      page: applied.page,
      pageSize: applied.pageSize,
      q: applied.q,
      category: applied.category,
      sort: applied.sort,
    });
  } catch {
    const retryHref = buildPublicationCatalogueHref({
      q: applied.q,
      category: applied.category,
      sort: applied.sort,
      page: applied.page,
      locale,
    });
    return (
      <CatalogueEmpty
        title={dict.catalogue.loadError}
        description={dict.catalogue.loadErrorBody}
        retryLabel={dict.catalogue.retry}
        retryHref={retryHref}
      />
    );
  }

  const totalPages = result.pagination.totalPages;
  const page = clampCataloguePage(applied.page, totalPages || 1);

  if (page !== applied.page && totalPages > 0) {
    result = await listPublishedPublications({
      locale,
      page,
      pageSize: applied.pageSize,
      q: applied.q,
      category: applied.category,
      sort: applied.sort,
    });
  }

  const summaryTemplate = hasFilters
    ? dict.publications.resultsSummaryFiltered
    : dict.publications.resultsSummary;
  const summary = formatResultsSummary(summaryTemplate, {
    page: result.pagination.page,
    pageSize: result.pagination.pageSize,
    total: result.pagination.total,
  });

  const chips = [];
  if (applied.q) {
    chips.push({
      id: "q",
      label: `${dict.publications.searchChip}: “${applied.q}”`,
      removeHref: buildPublicationCatalogueHref({
        category: applied.category,
        sort: applied.sort,
        page: 1,
        locale,
      }),
    });
  }
  if (applied.category) {
    const categoryName =
      categories.find((c) => c.slug === applied.category)?.name ??
      applied.category;
    chips.push({
      id: "category",
      label: `${dict.publications.categoryLabel}: ${categoryName}`,
      removeHref: buildPublicationCatalogueHref({
        q: applied.q,
        sort: applied.sort,
        page: 1,
        locale,
      }),
    });
  }

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
            hasFilters
              ? dict.publications.noMatches
              : dict.publications.emptyCatalogue
          }
          description={
            hasFilters
              ? dict.publications.noMatchesBody
              : dict.publications.emptyCatalogueBody
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
      <PublicationGrid
        locale={locale}
        items={result.items}
        emptyLabel={dict.publications.empty}
        categoryLabels={dict.publications}
        readMoreLabel={dict.publications.readMore}
      />
      <Pagination
        page={result.pagination.page}
        totalPages={result.pagination.totalPages}
        previousLabel={dict.catalogue.previous}
        nextLabel={dict.catalogue.next}
        pageOfLabel={dict.catalogue.pageOf}
        hrefForPage={(nextPage) =>
          buildPublicationCatalogueHref({
            q: applied.q,
            category: applied.category,
            sort: applied.sort,
            page: nextPage,
            locale,
          })
        }
      />
    </div>
  );
}

export default async function PublicationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const locale = await getRequestLocale();
  const dict = await getDictionary(locale);
  const raw = await searchParams;
  const applied = parsePublicationCatalogueParams(raw);
  const categories = await listPublicationCategories(locale);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          {
            name: dict.nav.home,
            url: absoluteLocalizedUrl("/", locale),
          },
          {
            name: dict.publications.title,
            url: absoluteLocalizedUrl("/publications", locale),
          },
        ])}
      />
      <PageHero
        title={dict.publications.title}
        description={dict.publications.heroDescription}
        image={PAGE_HEROES.publications}
        breadcrumbLabel={dict.shared.breadcrumbNav}
        breadcrumbs={[
          { label: dict.nav.home, href: sitePath("/", locale) },
          { label: dict.publications.title },
        ]}
      />
      <Container className="flex flex-col gap-6 pt-10 pb-10 sm:gap-7 sm:pt-12 sm:pb-12 lg:pt-14">
        <CatalogueLiveProvider>
          <div className="flex flex-col gap-6">
            <PublicationFilters
              locale={locale}
              labels={dict.publications}
              catalogueLabels={dict.catalogue}
              categories={categories}
              applied={{
                q: applied.q,
                category: applied.category,
                sort: applied.sort,
              }}
            />
            <CatalogueResultsFrame loadingLabel={dict.catalogue.loading}>
              <Suspense
                fallback={<ResultsPending label={dict.catalogue.loading} />}
              >
                <PublicationsResults
                  locale={locale}
                  dict={dict}
                  applied={applied}
                  categories={categories}
                />
              </Suspense>
            </CatalogueResultsFrame>
          </div>
        </CatalogueLiveProvider>
      </Container>
    </>
  );
}
