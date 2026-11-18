import { describe, expect, it } from "vitest";

import {
  extractMarkdownImageUrls,
  markdownReferencesMedia,
} from "@/lib/markdown-media";

describe("markdown-media", () => {
  it("detects storage keys and media URLs inside Markdown", () => {
    const key = "agenda/publications/inline/uuid-photo.jpg";
    const md = `Intro\n\n![Alt](/api/media/${key})\n\nMore`;
    expect(
      markdownReferencesMedia(md, {
        storageKey: key,
        publicUrl: `/api/media/${key}`,
      }),
    ).toBe(true);
    expect(
      markdownReferencesMedia("no images here", {
        storageKey: key,
        publicUrl: `/api/media/${key}`,
      }),
    ).toBe(false);
  });

  it("extracts image destinations from Markdown", () => {
    expect(
      extractMarkdownImageUrls(
        '![A](https://cdn.example/a.png "cap")\n\n![B](/api/media/agenda/x.jpg)',
      ),
    ).toEqual([
      "https://cdn.example/a.png",
      "/api/media/agenda/x.jpg",
    ]);
  });
});
