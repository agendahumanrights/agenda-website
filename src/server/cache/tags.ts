/** Shared cache tags for public content (`use cache` + `revalidateTag`). */
export const CACHE_TAGS = {
  publications: "publications",
  events: "events",
  founders: "founders",
  homepage: "homepage",
  categories: "categories",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];
