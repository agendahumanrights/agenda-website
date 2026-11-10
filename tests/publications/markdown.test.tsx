import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { MarkdownContent } from "@/components/shared/MarkdownContent";

const SAMPLE = `
# Title

**bold** *italic* ~~strike~~

- bullet
  - nested

1. one
2. two

- [ ] task
- [x] done

> quote

[safe](https://example.com) [bad](javascript:alert(1))

![Alt](https://example.com/a.png)

\`inline\`

\`\`\`ts
const x = 1;
\`\`\`

| A | B |
| - | - |
| 1 | 2 |

---

Hello <script>alert(1)</script> world
`.trim();

describe("MarkdownContent", () => {
  it("renders GFM features", () => {
    const html = renderToStaticMarkup(<MarkdownContent source={SAMPLE} />);
    expect(html).toContain("<h1>");
    expect(html).toContain("<strong>");
    expect(html).toContain("<em>");
    expect(html).toContain("<del>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<ol>");
    expect(html).toContain("<blockquote>");
    expect(html).toContain("<table>");
    expect(html).toContain("<hr");
    expect(html).toContain("<pre");
    expect(html).toContain("<code");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('src="https://example.com/a.png"');
    expect(html).toContain('alt="Alt"');
    expect(html).toContain('type="checkbox"');
  });

  it("shifts heading levels for article bodies", () => {
    const html = renderToStaticMarkup(
      <MarkdownContent source={"# Title\n\n## Sub"} shiftHeadings />,
    );
    expect(html).toContain("<h2>");
    expect(html).toContain("<h3>");
    expect(html).not.toContain("<h1>");
  });

  it("strips raw HTML", () => {
    const html = renderToStaticMarkup(
      <MarkdownContent source={"Hello <script>alert(1)</script> world"} />,
    );
    expect(html.toLowerCase()).not.toContain("<script");
  });

  it("rejects javascript links and unsafe image protocols", () => {
    const html = renderToStaticMarkup(
      <MarkdownContent
        source={
          "[x](javascript:alert(1))\n\n![x](javascript:alert(1))\n\n![ok](https://cdn.example/a.png)"
        }
      />,
    );
    expect(html.toLowerCase()).not.toContain("javascript:");
    expect(html).toContain('src="https://cdn.example/a.png"');
  });
});
