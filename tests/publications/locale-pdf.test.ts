import { describe, expect, it } from "vitest";

import { resolveLocalePdfUrl } from "@/lib/publications/locale-pdf";
import {
  createPublicationBodySchema,
  updatePublicationBodySchema,
} from "@/server/validations/publications";

describe("resolveLocalePdfUrl", () => {
  it("returns only the English PDF on English pages", () => {
    expect(
      resolveLocalePdfUrl({
        locale: "en",
        pdfEnUrl: "https://cdn.example/en.pdf",
        pdfArUrl: "https://cdn.example/ar.pdf",
      }),
    ).toBe("https://cdn.example/en.pdf");
  });

  it("returns only the Arabic PDF on Arabic pages", () => {
    expect(
      resolveLocalePdfUrl({
        locale: "ar",
        pdfEnUrl: "https://cdn.example/en.pdf",
        pdfArUrl: "https://cdn.example/ar.pdf",
      }),
    ).toBe("https://cdn.example/ar.pdf");
  });

  it("does not fall back to the other language when missing", () => {
    expect(
      resolveLocalePdfUrl({
        locale: "ar",
        pdfEnUrl: "https://cdn.example/en.pdf",
        pdfArUrl: null,
      }),
    ).toBeNull();
    expect(
      resolveLocalePdfUrl({
        locale: "en",
        pdfEnUrl: "",
        pdfArUrl: "https://cdn.example/ar.pdf",
      }),
    ).toBeNull();
  });
});

describe("publication PDF validation fields", () => {
  it("accepts independent pdfEnId / pdfArId on create", () => {
    const parsed = createPublicationBodySchema.parse({
      categoryId: "cpubcat000000000000000001",
      status: "DRAFT",
      pdfEnId: "clxxxxxxxxxxxxxxxxxxxxxx1",
      pdfArId: "clxxxxxxxxxxxxxxxxxxxxxx2",
      translations: [{ locale: "en", title: "Hello", subtitle: "", description: "" }],
    });
    expect(parsed.pdfEnId).toBe("clxxxxxxxxxxxxxxxxxxxxxx1");
    expect(parsed.pdfArId).toBe("clxxxxxxxxxxxxxxxxxxxxxx2");
    expect("pdfId" in parsed).toBe(false);
  });

  it("allows clearing either PDF independently on update", () => {
    const parsed = updatePublicationBodySchema.parse({
      pdfEnId: null,
      pdfArId: "clxxxxxxxxxxxxxxxxxxxxxx3",
    });
    expect(parsed.pdfEnId).toBeNull();
    expect(parsed.pdfArId).toBe("clxxxxxxxxxxxxxxxxxxxxxx3");
  });
});
