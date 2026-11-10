/**
 * Turn Markdown (or lightly marked text) into a plain meta description.
 * Does not invent copy — returns empty string when nothing usable remains.
 */
export function markdownToPlainText(source: string): string {
  let text = source.replace(/\r\n/g, "\n");

  // Fenced / indented code
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/~~~[\s\S]*?~~~/g, " ");
  text = text.replace(/(?:^|\n)( {4,}|\t).*(?:\n|$)/g, " ");

  // Images / links
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Headings / quotes / lists / emphasis
  text = text.replace(/^#{1,6}\s+/gm, "");
  text = text.replace(/^\s{0,3}>\s?/gm, "");
  text = text.replace(/^\s*[-*+]\s+/gm, "");
  text = text.replace(/^\s*\d+\.\s+/gm, "");
  text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
  text = text.replace(/(\*|_)(.*?)\1/g, "$2");
  text = text.replace(/`([^`]+)`/g, "$1");
  text = text.replace(/~~(.*?)~~/g, "$1");

  // Tables / horizontal rules
  text = text.replace(/^\|.*\|$/gm, " ");
  text = text.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, " ");

  return text.replace(/\s+/g, " ").trim();
}

/** Prefer subtitle, else Markdown excerpt, else fallback — never fabricates. */
export function buildMetaDescription(input: {
  subtitle?: string | null;
  descriptionMarkdown?: string | null;
  fallback?: string | null;
  maxLength?: number;
}): string {
  const maxLength = input.maxLength ?? 160;
  const candidates = [
    input.subtitle?.trim(),
    input.descriptionMarkdown
      ? markdownToPlainText(input.descriptionMarkdown)
      : "",
    input.fallback?.trim(),
  ].filter((value): value is string => Boolean(value && value.length > 0));

  const raw = candidates[0] ?? "";
  if (!raw) return "";
  if (raw.length <= maxLength) return raw;

  const sliced = raw.slice(0, maxLength);
  const boundary = Math.max(
    sliced.lastIndexOf(" "),
    sliced.lastIndexOf("،"),
    sliced.lastIndexOf("。"),
  );
  const trimmed =
    boundary > maxLength * 0.6 ? sliced.slice(0, boundary) : sliced;
  return `${trimmed.trim().replace(/[.,;:،]+$/u, "")}…`;
}
