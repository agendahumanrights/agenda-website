/**
 * Helpers for images embedded in Markdown descriptions (not gallery/main media).
 */

/** True when Markdown text references a stored media object by key or public URL. */
export function markdownReferencesMedia(
  markdown: string | null | undefined,
  input: { storageKey: string; publicUrl?: string | null },
): boolean {
  if (!markdown) return false;
  const key = input.storageKey;
  if (!key) return false;
  if (markdown.includes(key)) return true;

  const encoded = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  if (encoded !== key && markdown.includes(encoded)) return true;
  if (markdown.includes(`/api/media/${encoded}`)) return true;
  if (markdown.includes(`/api/media/${key}`)) return true;

  const publicUrl = input.publicUrl?.trim();
  if (publicUrl && markdown.includes(publicUrl)) return true;

  return false;
}

/** Extract http(s) and same-origin /api/media image destinations from Markdown. */
export function extractMarkdownImageUrls(markdown: string): string[] {
  const urls: string[] = [];
  const re = /!\[[^\]]*]\(\s*<?([^)\s>]+)>?(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(markdown)) !== null) {
    const url = match[1]?.trim();
    if (url) urls.push(url);
  }
  return urls;
}
