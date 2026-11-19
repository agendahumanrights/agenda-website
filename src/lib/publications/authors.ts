/** Maximum writers assignable to one publication (admin + API). */
export const MAX_PUBLICATION_AUTHORS = 10;

/**
 * Normalize an ordered author id list: trim empties, reject duplicates by
 * keeping first occurrence, cap at MAX_PUBLICATION_AUTHORS.
 * Returns null when the input exceeds the max after unique filter (caller
 * should treat that as a validation error) — actually we return the capped
 * list and let Zod reject length > 10 before this runs.
 */
export function normalizeAuthorWriterIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
    if (out.length >= MAX_PUBLICATION_AUTHORS) break;
  }
  return out;
}
