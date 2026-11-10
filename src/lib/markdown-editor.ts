/**
 * Pure Markdown textarea transforms for the admin editor toolbar.
 * Values remain Markdown strings — never HTML.
 */

export type EditorSelection = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

export type EditorUpdate = EditorSelection;

function replaceRange(
  value: string,
  start: number,
  end: number,
  insert: string,
): string {
  return value.slice(0, start) + insert + value.slice(end);
}

function lineBounds(value: string, index: number): { start: number; end: number } {
  const start = value.lastIndexOf("\n", Math.max(0, index - 1)) + 1;
  const nextBreak = value.indexOf("\n", index);
  const end = nextBreak === -1 ? value.length : nextBreak;
  return { start, end };
}

/** Expand selection to cover full lines (for list/heading ops). */
export function expandToLineRange(sel: EditorSelection): {
  start: number;
  end: number;
  text: string;
} {
  const start = lineBounds(sel.value, sel.selectionStart).start;
  const end = lineBounds(sel.value, Math.max(sel.selectionEnd - 1, sel.selectionStart)).end;
  return { start, end, text: sel.value.slice(start, end) };
}

export function wrapInline(
  sel: EditorSelection,
  before: string,
  after: string,
  placeholder: string,
): EditorUpdate {
  const { value, selectionStart, selectionEnd } = sel;
  const selected = value.slice(selectionStart, selectionEnd);
  const inner = selected.length > 0 ? selected : placeholder;
  const insert = `${before}${inner}${after}`;
  const next = replaceRange(value, selectionStart, selectionEnd, insert);
  const start = selectionStart + before.length;
  return {
    value: next,
    selectionStart: start,
    selectionEnd: start + inner.length,
  };
}

export function insertSnippet(
  sel: EditorSelection,
  snippet: string,
  selectOffset = 0,
  selectLength = 0,
): EditorUpdate {
  const next = replaceRange(
    sel.value,
    sel.selectionStart,
    sel.selectionEnd,
    snippet,
  );
  const start = sel.selectionStart + selectOffset;
  return {
    value: next,
    selectionStart: start,
    selectionEnd: start + selectLength,
  };
}

const HEADING_RE = /^(#{1,6})\s+/;

export function applyHeading(sel: EditorSelection, level: 1 | 2 | 3 | 4 | 5 | 6): EditorUpdate {
  const { start, end, text } = expandToLineRange(sel);
  const prefix = `${"#".repeat(level)} `;
  const sourceLines = text.length === 0 ? [""] : text.split("\n");
  const cleaned = sourceLines.map((line) => {
    const stripped = line.replace(HEADING_RE, "");
    const body = stripped.length > 0 ? stripped : "Heading";
    return `${prefix}${body}`;
  });
  const insert = cleaned.join("\n");
  const next = replaceRange(sel.value, start, end, insert);
  const firstBodyStart = start + prefix.length;
  const firstLine = cleaned[0] ?? `${prefix}Heading`;
  const bodyLen = firstLine.length - prefix.length;
  return {
    value: next,
    selectionStart: firstBodyStart,
    selectionEnd: firstBodyStart + bodyLen,
  };
}

type LinePrefixMode = "bullet" | "numbered" | "task" | "quote";

function linePrefix(mode: LinePrefixMode, index: number): string {
  switch (mode) {
    case "bullet":
      return "- ";
    case "numbered":
      return `${index + 1}. `;
    case "task":
      return "- [ ] ";
    case "quote":
      return "> ";
  }
}

const BULLET_RE = /^\s*[-*+]\s+/;
const TASK_RE = /^\s*[-*+]\s+\[[ xX]\]\s+/;
const NUMBER_RE = /^\s*\d+\.\s+/;
const QUOTE_RE = /^>\s?/;

function stripLinePrefix(line: string): string {
  if (TASK_RE.test(line)) return line.replace(TASK_RE, "");
  if (BULLET_RE.test(line)) return line.replace(BULLET_RE, "");
  if (NUMBER_RE.test(line)) return line.replace(NUMBER_RE, "");
  if (QUOTE_RE.test(line)) return line.replace(QUOTE_RE, "");
  return line;
}

export function applyLinePrefix(
  sel: EditorSelection,
  mode: LinePrefixMode,
): EditorUpdate {
  const { start, end, text } = expandToLineRange(sel);
  const rawLines = text.length === 0 ? [""] : text.split("\n");
  const cleaned = rawLines.map((line) => stripLinePrefix(line));
  const insert = cleaned
    .map((line, i) => {
      const body = line.length > 0 ? line : placeholderFor(mode);
      return `${linePrefix(mode, i)}${body}`;
    })
    .join("\n");
  const next = replaceRange(sel.value, start, end, insert);
  const firstPrefix = linePrefix(mode, 0);
  const firstBody = cleaned[0]?.length ? cleaned[0] : placeholderFor(mode);
  return {
    value: next,
    selectionStart: start + firstPrefix.length,
    selectionEnd: start + firstPrefix.length + firstBody.length,
  };
}

function placeholderFor(mode: LinePrefixMode): string {
  switch (mode) {
    case "bullet":
    case "numbered":
      return "List item";
    case "task":
      return "Task";
    case "quote":
      return "Quote";
  }
}

export function insertHorizontalRule(sel: EditorSelection): EditorUpdate {
  const needsLead = sel.selectionStart > 0 && sel.value[sel.selectionStart - 1] !== "\n";
  const needsTrail =
    sel.selectionEnd < sel.value.length && sel.value[sel.selectionEnd] !== "\n";
  const snippet = `${needsLead ? "\n" : ""}\n---\n${needsTrail ? "\n" : ""}`;
  const cursor = sel.selectionStart + snippet.length;
  return {
    value: replaceRange(sel.value, sel.selectionStart, sel.selectionEnd, snippet),
    selectionStart: cursor,
    selectionEnd: cursor,
  };
}

export function insertLink(
  sel: EditorSelection,
  url: string,
  text?: string,
): EditorUpdate {
  const selected = sel.value.slice(sel.selectionStart, sel.selectionEnd);
  const label = (text?.trim() || selected || "link text").trim();
  const safeUrl = url.trim() || "https://";
  const snippet = `[${label}](${safeUrl})`;
  const next = replaceRange(sel.value, sel.selectionStart, sel.selectionEnd, snippet);
  if (!selected && !text?.trim()) {
    return {
      value: next,
      selectionStart: sel.selectionStart + 1,
      selectionEnd: sel.selectionStart + 1 + label.length,
    };
  }
  const urlStart = sel.selectionStart + label.length + 3;
  return {
    value: next,
    selectionStart: urlStart,
    selectionEnd: urlStart + safeUrl.length,
  };
}

export function insertImage(
  sel: EditorSelection,
  url: string,
  alt: string,
): EditorUpdate {
  const altText = alt.trim() || "image";
  const safeUrl = url.trim() || "https://";
  const snippet = `![${altText}](${safeUrl})`;
  const next = replaceRange(sel.value, sel.selectionStart, sel.selectionEnd, snippet);
  const urlStart = sel.selectionStart + altText.length + 4;
  return {
    value: next,
    selectionStart: urlStart,
    selectionEnd: urlStart + safeUrl.length,
  };
}

export function insertFencedCode(
  sel: EditorSelection,
  language = "",
): EditorUpdate {
  const selected = sel.value.slice(sel.selectionStart, sel.selectionEnd);
  const body = selected || "code";
  const lang = language.trim();
  const snippet = `\`\`\`${lang}\n${body}\n\`\`\``;
  const next = replaceRange(sel.value, sel.selectionStart, sel.selectionEnd, snippet);
  const bodyStart = sel.selectionStart + 3 + lang.length + 1;
  return {
    value: next,
    selectionStart: bodyStart,
    selectionEnd: bodyStart + body.length,
  };
}

export function insertTable(sel: EditorSelection): EditorUpdate {
  const snippet = [
    "| Column 1 | Column 2 | Column 3 |",
    "| -------- | -------- | -------- |",
    "| Cell     | Cell     | Cell     |",
    "| Cell     | Cell     | Cell     |",
  ].join("\n");
  const lead = sel.selectionStart > 0 && sel.value[sel.selectionStart - 1] !== "\n" ? "\n\n" : "";
  const full = `${lead}${snippet}\n`;
  const next = replaceRange(sel.value, sel.selectionStart, sel.selectionEnd, full);
  const cellStart = sel.selectionStart + lead.length + 2;
  return {
    value: next,
    selectionStart: cellStart,
    selectionEnd: cellStart + "Column 1".length,
  };
}

/** Strip common Markdown markers for plain-text excerpts. */
export function markdownToPlainText(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, (m) => m.slice(1, -1))
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*>+\s?/gm, "")
    .replace(/^\s*[-*+]\s+(\[[ xX]]\s+)?/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/\|/g, " ")
    .replace(/-{3,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
