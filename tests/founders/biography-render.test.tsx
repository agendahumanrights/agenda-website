import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { FounderBiography } from "@/components/about/FounderBiography";

const baseFounder = {
  id: "1",
  bioKey: "jane-doe",
  fullName: "Jane Doe",
  professionalArea: "Law",
  email: "jane@example.com",
  profileImageUrl: null as string | null,
  biography: "Line one\n\nLine two <b>x</b>",
};

describe("FounderBiography", () => {
  it("renders plain-text biography with stable anchor id", () => {
    const html = renderToStaticMarkup(
      <FounderBiography founder={baseFounder} emailLabel="Email" />,
    );
    expect(html).toContain('id="founder-jane-doe"');
    expect(html).toContain("anchor-offset");
    expect(html).toContain("Jane Doe");
    expect(html).toContain("Law");
    expect(html).toContain("mailto:jane@example.com");
    expect(html).toContain("Email:");
    expect(html).toContain("Line one");
    // Plain text — angle brackets should not become HTML tags from biography
    expect(html).toContain("&lt;b&gt;x&lt;/b&gt;");
  });

  it("hides empty optional fields and supports reverse layout class", () => {
    const html = renderToStaticMarkup(
      <FounderBiography
        reverse
        emailLabel="Email"
        founder={{
          ...baseFounder,
          professionalArea: "  ",
          email: null,
          biography: "",
        }}
      />,
    );
    expect(html).toContain('id="founder-jane-doe"');
    expect(html).toContain("lg:flex-row-reverse");
    expect(html).not.toContain("mailto:");
    expect(html).not.toContain("Law");
  });
});
