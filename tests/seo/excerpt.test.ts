import { describe, expect, it } from "vitest";

import {
  buildMetaDescription,
  markdownToPlainText,
} from "@/lib/seo/excerpt";
import {
  LANG_QUERY_PARAM,
  localizedHref,
  URL_DEFAULT_LOCALE,
} from "@/lib/seo/locale-url";

describe("markdownToPlainText", () => {
  it("strips markdown noise", () => {
    expect(
      markdownToPlainText(
        "# Hello\n\nThis is **bold** with a [link](https://x.test) and `code`.",
      ),
    ).toBe("Hello This is bold with a link and code.");
  });
});

describe("buildMetaDescription", () => {
  it("prefers subtitle over markdown", () => {
    expect(
      buildMetaDescription({
        subtitle: "Short subtitle",
        descriptionMarkdown: "# Long body that should not win",
      }),
    ).toBe("Short subtitle");
  });

  it("truncates long plain text on a word boundary", () => {
    const long = "word ".repeat(50).trim();
    const result = buildMetaDescription({
      descriptionMarkdown: long,
      maxLength: 40,
    });
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(42);
  });
});

describe("localizedHref", () => {
  it("omits lang for English and sets lang=ar for Arabic", () => {
    expect(localizedHref("/publications", URL_DEFAULT_LOCALE)).toBe(
      "/publications",
    );
    expect(localizedHref("/publications", "ar")).toBe(
      `/publications?${LANG_QUERY_PARAM}=ar`,
    );
  });

  it("preserves other query params with Arabic lang", () => {
    expect(
      localizedHref("/publications", "ar", { q: "rights", page: "2" }),
    ).toBe(`/publications?q=rights&page=2&${LANG_QUERY_PARAM}=ar`);
  });
});
