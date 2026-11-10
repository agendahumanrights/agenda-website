import { describe, expect, it } from "vitest";

import {
  buildEventCatalogueHref,
  buildPublicationCatalogueHref,
  clampCataloguePage,
  parseEventCatalogueParams,
  parsePublicationCatalogueParams,
} from "@/lib/catalogue-query";
import {
  CATALOGUE_SEARCH_DEBOUNCE_MS,
  catalogueSearchDelayMs,
} from "@/lib/catalogue-live-search";
import { formatResultsSummary } from "@/lib/catalogue-summary";

describe("parsePublicationCatalogueParams", () => {
  it("parses q, category, sort, and page", () => {
    const parsed = parsePublicationCatalogueParams({
      q: "  rights ",
      category: "BLOG",
      sort: "oldest",
      page: "2",
    });
    expect(parsed).toEqual({
      q: "rights",
      category: "BLOG",
      sort: "oldest",
      page: 2,
      pageSize: 12,
    });
  });

  it("defaults sort to newest and ignores invalid sort", () => {
    expect(parsePublicationCatalogueParams({}).sort).toBe("newest");
    expect(parsePublicationCatalogueParams({ sort: "bogus" }).sort).toBe(
      "newest",
    );
  });

  it("ignores invalid category and page", () => {
    const parsed = parsePublicationCatalogueParams({
      category: "bad category!",
      page: "0",
    });
    expect(parsed.category).toBeUndefined();
    expect(parsed.page).toBe(1);
  });

  it("accepts dynamic category slugs", () => {
    const parsed = parsePublicationCatalogueParams({
      category: "research",
    });
    expect(parsed.category).toBe("research");
  });
});

describe("parseEventCatalogueParams", () => {
  it("parses q, sort, and page", () => {
    const parsed = parseEventCatalogueParams({
      q: " workshop ",
      sort: "oldest",
      page: "3",
    });
    expect(parsed).toEqual({
      q: "workshop",
      sort: "oldest",
      page: 3,
      pageSize: 12,
    });
  });

  it("defaults sort to newest", () => {
    expect(parseEventCatalogueParams({}).sort).toBe("newest");
  });

  it("ignores legacy createdFrom/createdTo so they do not filter", () => {
    const parsed = parseEventCatalogueParams({
      q: "safety",
      createdFrom: "2026-03-15",
      createdTo: "2026-03-20",
      page: "2",
    });
    expect(parsed).toEqual({
      q: "safety",
      sort: "newest",
      page: 2,
      pageSize: 12,
    });
    expect(parsed).not.toHaveProperty("createdFrom");
    expect(parsed).not.toHaveProperty("createdTo");
  });
});

describe("catalogue href builders", () => {
  it("omits empty defaults from publication URLs", () => {
    expect(buildPublicationCatalogueHref({})).toBe("/publications");
    expect(
      buildPublicationCatalogueHref({
        q: "  ",
        category: "ALL",
        sort: "newest",
        page: 1,
      }),
    ).toBe("/publications");
    expect(
      buildPublicationCatalogueHref({
        q: "safety",
        category: "REPORT",
        sort: "oldest",
        page: 3,
      }),
    ).toBe("/publications?q=safety&category=REPORT&sort=oldest&page=3");
  });

  it("builds event URLs with q, sort, and page", () => {
    expect(buildEventCatalogueHref({})).toBe("/events");
    expect(
      buildEventCatalogueHref({
        q: "workshop",
        page: 2,
      }),
    ).toBe("/events?q=workshop&page=2");
    expect(
      buildEventCatalogueHref({
        q: "workshop",
        sort: "oldest",
        page: 2,
      }),
    ).toBe("/events?q=workshop&sort=oldest&page=2");
  });
});

describe("live search debounce", () => {
  it("applies cleared search immediately and debounces non-empty text", () => {
    expect(catalogueSearchDelayMs("")).toBe(0);
    expect(catalogueSearchDelayMs("   ")).toBe(0);
    expect(catalogueSearchDelayMs("rights")).toBe(CATALOGUE_SEARCH_DEBOUNCE_MS);
  });
});

describe("pagination helpers", () => {
  it("clamps out-of-range pages", () => {
    expect(clampCataloguePage(99, 3)).toBe(3);
    expect(clampCataloguePage(0, 3)).toBe(1);
    expect(clampCataloguePage(2, 0)).toBe(1);
  });

  it("formats results summary ranges", () => {
    expect(
      formatResultsSummary("Showing {from}–{to} of {total}", {
        page: 2,
        pageSize: 12,
        total: 28,
      }),
    ).toBe("Showing 13–24 of 28");
    expect(
      formatResultsSummary("Showing {from}–{to} of {total}", {
        page: 1,
        pageSize: 12,
        total: 0,
      }),
    ).toBe("Showing 0–0 of 0");
  });
});
