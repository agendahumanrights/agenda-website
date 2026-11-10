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
  it("omits prefix for English and uses /ar for Arabic", () => {
    expect(localizedHref("/publications", URL_DEFAULT_LOCALE)).toBe(
      "/publications",
    );
    expect(localizedHref("/publications", "ar")).toBe("/ar/publications");
    expect(localizedHref("/", "ar")).toBe("/ar");
  });

  it("preserves other query params under the Arabic prefix", () => {
    expect(
      localizedHref("/publications", "ar", { q: "rights", page: "2" }),
    ).toBe("/ar/publications?q=rights&page=2");
  });

  it("strips a legacy lang query instead of emitting it", () => {
    expect(
      localizedHref("/about", "ar", { [LANG_QUERY_PARAM]: "ar", q: "x" }),
    ).toBe("/ar/about?q=x");
  });
});
