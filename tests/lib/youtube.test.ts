import { describe, expect, it } from "vitest";

import {
  extractYouTubeVideoId,
  normalizeYouTubeUrl,
  parseYouTubeUrl,
} from "@/lib/youtube";
import { optionalYoutubeUrlSchema } from "@/server/validations/youtube";
import { createPublicationBodySchema } from "@/server/validations/publications";
import { createEventBodySchema } from "@/server/validations/events";

const VIDEO_ID = "dQw4w9WgXcQ";

describe("youtube url parsing", () => {
  it("accepts common YouTube URL formats", () => {
    const samples = [
      `https://www.youtube.com/watch?v=${VIDEO_ID}`,
      `https://www.youtube.com/watch?v=${VIDEO_ID}&t=60`,
      `https://youtu.be/${VIDEO_ID}`,
      `https://youtu.be/${VIDEO_ID}?t=30`,
      `https://www.youtube.com/embed/${VIDEO_ID}`,
      `https://www.youtube.com/shorts/${VIDEO_ID}`,
      `https://m.youtube.com/watch?v=${VIDEO_ID}`,
      `http://www.youtube.com/watch?v=${VIDEO_ID}`,
      `https://www.youtube-nocookie.com/embed/${VIDEO_ID}`,
    ];

    for (const sample of samples) {
      expect(extractYouTubeVideoId(sample)).toBe(VIDEO_ID);
      expect(normalizeYouTubeUrl(sample)).toBe(
        `https://www.youtube.com/watch?v=${VIDEO_ID}`,
      );
      expect(parseYouTubeUrl(sample)?.embedUrl).toBe(
        `https://www.youtube-nocookie.com/embed/${VIDEO_ID}`,
      );
    }
  });

  it("rejects non-YouTube and malformed URLs", () => {
    const rejected = [
      "",
      "not-a-url",
      "https://example.com/watch?v=dQw4w9WgXcQ",
      "https://www.youtube.com/watch?v=short",
      "https://www.youtube.com/watch?v=toolongvideoidx",
      "javascript:alert(1)",
      "https://www.youtube.com/channel/UC123",
      "https://www.youtube.com/",
    ];
    for (const sample of rejected) {
      expect(extractYouTubeVideoId(sample)).toBeNull();
      expect(normalizeYouTubeUrl(sample)).toBeNull();
    }
  });
});

describe("optionalYoutubeUrlSchema", () => {
  it("normalizes valid URLs and clears empty values", () => {
    expect(
      optionalYoutubeUrlSchema.parse(
        `https://youtu.be/${VIDEO_ID}?si=abc`,
      ),
    ).toBe(`https://www.youtube.com/watch?v=${VIDEO_ID}`);
    expect(optionalYoutubeUrlSchema.parse("")).toBeNull();
    expect(optionalYoutubeUrlSchema.parse(null)).toBeNull();
    expect(optionalYoutubeUrlSchema.parse(undefined)).toBeUndefined();
  });

  it("rejects invalid URLs", () => {
    expect(
      optionalYoutubeUrlSchema.safeParse("https://vimeo.com/123").success,
    ).toBe(false);
  });
});

describe("create bodies accept optional youtubeUrl", () => {
  it("publication create without youtube succeeds", () => {
    const parsed = createPublicationBodySchema.parse({
      categoryId: "cpubcat000000000000000001",
      translations: [{ locale: "en", title: "Hello" }],
    });
    expect(parsed.youtubeUrl).toBeUndefined();
  });

  it("event create with valid youtube normalizes", () => {
    const parsed = createEventBodySchema.parse({
      eventDate: new Date("2026-01-01"),
      translations: [{ locale: "en", title: "Hello" }],
      youtubeUrl: `https://youtu.be/${VIDEO_ID}`,
    });
    expect(parsed.youtubeUrl).toBe(
      `https://www.youtube.com/watch?v=${VIDEO_ID}`,
    );
  });
});
