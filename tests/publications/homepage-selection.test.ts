import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Guardrail: publication-only homepage saves must not rewrite FeaturedEvent.
 */
describe("setFeaturedPublications contract", () => {
  it("only deletes/creates FeaturedPublication rows in publication-only save", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/server/services/homepage.ts"),
      "utf8",
    );
    const fnStart = source.indexOf("export async function setFeaturedPublications");
    const fnEnd = source.indexOf("export async function setFeaturedEvents");
    const body = source.slice(fnStart, fnEnd);
    expect(body).toContain("featuredPublication.deleteMany");
    expect(body).toContain("featuredPublication.createMany");
    expect(body).not.toContain("featuredEvent.deleteMany");
    expect(body).not.toContain("featuredEvent.createMany");
  });
});
