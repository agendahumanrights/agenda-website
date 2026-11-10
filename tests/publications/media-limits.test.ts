import { describe, expect, it } from "vitest";

import {
  countContentImages,
  isContentImageCountAllowed,
  remainingContentImageSlots,
} from "@/lib/content-image-limits";
import {
  ALLOWED_IMAGE_MIME,
  ALLOWED_PDF_MIME,
  MEDIA_LIMITS,
} from "@/server/storage/limits";
import { assertContentImageCountAllowed } from "@/server/storage/content-image-limits";
import { AppError } from "@/server/http/errors";
import {
  createPublicationBodySchema,
  updatePublicationBodySchema,
} from "@/server/validations/publications";
import {
  createEventBodySchema,
  updateEventBodySchema,
} from "@/server/validations/events";

const cuid = (n: number) => `c${String(n).padStart(24, "x")}`;

describe("media limits", () => {
  it("allows common raster images and pdf only", () => {
    expect(ALLOWED_IMAGE_MIME.has("image/jpeg")).toBe(true);
    expect(ALLOWED_IMAGE_MIME.has("image/svg+xml")).toBe(false);
    expect(ALLOWED_PDF_MIME.has("application/pdf")).toBe(true);
    expect(ALLOWED_PDF_MIME.has("application/x-msdownload")).toBe(false);
  });

  it("caps publications and events at 10 total images (1 main + 9 gallery)", () => {
    expect(MEDIA_LIMITS.maxImageBytes).toBeGreaterThan(0);
    expect(MEDIA_LIMITS.maxPdfBytes).toBeGreaterThan(MEDIA_LIMITS.maxImageBytes);
    expect(MEDIA_LIMITS.maxImagesPerItem).toBe(10);
    expect(MEDIA_LIMITS.maxGalleryImages).toBe(9);
  });

  it("counts main + gallery for remaining slots", () => {
    expect(countContentImages(true, 3)).toBe(4);
    expect(remainingContentImageSlots(true, 3, 10)).toBe(6);
    expect(remainingContentImageSlots(true, 9, 10)).toBe(0);
    expect(remainingContentImageSlots(false, 10, 10)).toBe(0);
  });

  it("grandfathers over-limit counts that do not increase", () => {
    expect(isContentImageCountAllowed(12, 10, 12)).toBe(true);
    expect(isContentImageCountAllowed(11, 10, 12)).toBe(true);
    expect(isContentImageCountAllowed(13, 10, 12)).toBe(false);
    expect(isContentImageCountAllowed(11, 10)).toBe(false);
  });

  it("rejects create payloads that exceed the total image cap via assert", () => {
    expect(() =>
      assertContentImageCountAllowed({
        mainImageId: cuid(1),
        galleryImageIds: Array.from({ length: 10 }, (_, i) => cuid(i + 2)),
      }),
    ).toThrow(AppError);

    expect(() =>
      assertContentImageCountAllowed({
        mainImageId: cuid(1),
        galleryImageIds: Array.from({ length: 9 }, (_, i) => cuid(i + 2)),
      }),
    ).not.toThrow();
  });

  it("allows update payloads that keep or reduce an over-limit count", () => {
    expect(() =>
      assertContentImageCountAllowed({
        mainImageId: cuid(1),
        galleryImageIds: Array.from({ length: 12 }, (_, i) => cuid(i + 2)),
        previousCount: 13,
      }),
    ).not.toThrow();

    expect(() =>
      assertContentImageCountAllowed({
        mainImageId: cuid(1),
        galleryImageIds: Array.from({ length: 13 }, (_, i) => cuid(i + 2)),
        previousCount: 13,
      }),
    ).toThrow(AppError);
  });

  it("rejects create schemas with more than maxImagesPerItem gallery ids", () => {
    const tooMany = Array.from(
      { length: MEDIA_LIMITS.maxImagesPerItem + 1 },
      (_, i) => cuid(i + 1),
    );
    expect(
      createPublicationBodySchema.safeParse({
        categoryId: "cpubcat000000000000000001",
        translations: [{ locale: "en", title: "Hello" }],
        galleryImageIds: tooMany,
      }).success,
    ).toBe(false);
    expect(
      createEventBodySchema.safeParse({
        eventDate: new Date("2026-01-01"),
        translations: [{ locale: "en", title: "Hello" }],
        galleryImageIds: tooMany,
      }).success,
    ).toBe(false);
  });

  it("parses update schemas with grandfathered over-limit gallery arrays", () => {
    const overLimit = Array.from({ length: 15 }, (_, i) => cuid(i + 1));
    expect(
      updatePublicationBodySchema.safeParse({ galleryImageIds: overLimit })
        .success,
    ).toBe(true);
    expect(
      updateEventBodySchema.safeParse({ galleryImageIds: overLimit }).success,
    ).toBe(true);
  });
});
