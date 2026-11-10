import { describe, expect, it } from "vitest";

import { AppError } from "@/server/http/errors";
import {
  assertSafeStorageKey,
  folderForMediaPurpose,
  joinPublicObjectUrl,
  sanitizeUploadFilename,
} from "@/server/storage/keys";
import { parseR2PublicHostname } from "@/server/storage/r2-env";

describe("storage keys", () => {
  it("maps media purposes to agenda/ folders", () => {
    expect(folderForMediaPurpose("publication-main")).toBe(
      "agenda/publications/main",
    );
    expect(folderForMediaPurpose("publication-gallery")).toBe(
      "agenda/publications/gallery",
    );
    expect(folderForMediaPurpose("publication-pdf")).toBe(
      "agenda/publications/documents",
    );
    expect(folderForMediaPurpose("event-main")).toBe("agenda/events/main");
    expect(folderForMediaPurpose("event-gallery")).toBe(
      "agenda/events/gallery",
    );
    expect(folderForMediaPurpose("founder-profile")).toBe(
      "agenda/founders/profile",
    );
  });

  it("rejects path traversal in storage keys", () => {
    expect(() => assertSafeStorageKey("../secret")).toThrow(AppError);
    expect(() => assertSafeStorageKey("agenda/../secret")).toThrow(AppError);
    expect(assertSafeStorageKey("agenda/publications/main/a.jpg")).toBe(
      "agenda/publications/main/a.jpg",
    );
  });

  it("sanitizes filenames without trusting user path segments", () => {
    expect(sanitizeUploadFilename("../../etc/passwd.png")).toBe("passwd.png");
    expect(sanitizeUploadFilename("photo (1).JPG")).toBe("photo (1).JPG");
  });

  it("builds public URLs from the public base, not the S3 endpoint", () => {
    expect(
      joinPublicObjectUrl(
        "https://cdn.example.com/",
        "agenda/publications/main/file.jpg",
      ),
    ).toBe("https://cdn.example.com/agenda/publications/main/file.jpg");
  });
});

describe("parseR2PublicHostname", () => {
  it("extracts hostname for next/image remotePatterns", () => {
    expect(
      parseR2PublicHostname("https://pub-example.r2.dev/media"),
    ).toEqual({
      protocol: "https",
      hostname: "pub-example.r2.dev",
      port: "",
    });
  });

  it("returns null for invalid values", () => {
    expect(parseR2PublicHostname("")).toBeNull();
    expect(parseR2PublicHostname("not-a-url")).toBeNull();
  });
});
