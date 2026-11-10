import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("homepage event selection contracts", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/server/services/homepage.ts"),
    "utf8",
  );

  it("setFeaturedEvents only mutates FeaturedEvent rows", () => {
    const start = source.indexOf("export async function setFeaturedEvents");
    const end = source.indexOf("export async function patchHomepageSelection");
    const body = source.slice(start, end);
    expect(body).toContain("featuredEvent.deleteMany");
    expect(body).toContain("featuredEvent.createMany");
    expect(body).not.toContain("featuredPublication.deleteMany");
    expect(body).toContain("MAX_FEATURED_EVENTS");
  });

  it("setFeaturedPublications does not mutate FeaturedEvent rows", () => {
    const start = source.indexOf("export async function setFeaturedPublications");
    const end = source.indexOf("export async function setFeaturedEvents");
    const body = source.slice(start, end);
    expect(body).toContain("featuredPublication.deleteMany");
    expect(body).not.toContain("featuredEvent.deleteMany");
  });
});
