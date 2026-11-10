/** Debounce delay for live catalogue title search (ms). */
export const CATALOGUE_SEARCH_DEBOUNCE_MS = 300;

/**
 * Delay before applying a draft search string to the URL.
 * Empty (cleared) search applies immediately so results restore without waiting.
 */
export function catalogueSearchDelayMs(draftQuery: string): number {
  return draftQuery.trim().length === 0 ? 0 : CATALOGUE_SEARCH_DEBOUNCE_MS;
}
