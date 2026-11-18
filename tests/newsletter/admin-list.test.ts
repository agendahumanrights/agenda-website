import { describe, expect, it } from "vitest";

import { adminNewsletterListQuerySchema } from "@/server/validations/newsletter";

describe("adminNewsletterListQuerySchema", () => {
  it("defaults pagination and accepts optional search/status", () => {
    expect(adminNewsletterListQuerySchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 12,
    });

    expect(
      adminNewsletterListQuerySchema.parse({
        page: "2",
        q: "agenda@",
        status: "ACTIVE",
      }),
    ).toMatchObject({
      page: 2,
      q: "agenda@",
      status: "ACTIVE",
    });
  });

  it("rejects invalid status values", () => {
    expect(() =>
      adminNewsletterListQuerySchema.parse({ status: "PENDING" }),
    ).toThrow();
  });
});
