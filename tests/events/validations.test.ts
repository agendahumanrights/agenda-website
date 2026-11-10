import { describe, expect, it } from "vitest";

import {
  adminEventListQuerySchema,
  createEventBodySchema,
} from "@/server/validations/events";
import {
  featuredEventOrderSchema,
  homepageSelectionPatchSchema,
} from "@/server/validations/homepage";
import { parseUtcDateOnly, startOfUtcDay, endOfUtcDay } from "@/lib/dates";

describe("event validations", () => {
  it("accepts draft create with one title and eventDate", () => {
    const parsed = createEventBodySchema.parse({
      status: "DRAFT",
      eventDate: "2026-10-18",
      translations: [{ locale: "en", title: "Meetup", subtitle: "", description: "" }],
    });
    expect(parsed.status).toBe("DRAFT");
    expect(parsed.eventDate).toBeInstanceOf(Date);
  });

  it("rejects invalid created date ranges", () => {
    const result = adminEventListQuerySchema.safeParse({
      createdFrom: "2026-10-20",
      createdTo: "2026-10-10",
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than three featured events", () => {
    const ids = [
      "clxxxxxxxxxxxxxxxxxxxxxx1",
      "clxxxxxxxxxxxxxxxxxxxxxx2",
      "clxxxxxxxxxxxxxxxxxxxxxx3",
      "clxxxxxxxxxxxxxxxxxxxxxx4",
    ];
    const result = featuredEventOrderSchema.safeParse({ eventIds: ids });
    expect(result.success).toBe(false);
  });

  it("preserves omitted homepage sections in patch shape", () => {
    const parsed = homepageSelectionPatchSchema.parse({
      eventIds: [],
    });
    expect(parsed.featuredEvents).toEqual({ eventIds: [] });
    expect(parsed.featuredPublications).toBeUndefined();
  });
});

describe("date helpers", () => {
  it("keeps calendar dates as UTC noon", () => {
    const d = parseUtcDateOnly("2026-03-15");
    expect(d.toISOString()).toBe("2026-03-15T12:00:00.000Z");
  });

  it("builds inclusive createdAt day bounds", () => {
    expect(startOfUtcDay("2026-03-15").toISOString()).toBe(
      "2026-03-15T00:00:00.000Z",
    );
    expect(endOfUtcDay("2026-03-15").toISOString()).toBe(
      "2026-03-15T23:59:59.999Z",
    );
  });
});
