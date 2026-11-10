import { describe, expect, it } from "vitest";

import {
  applyHeading,
  applyLinePrefix,
  insertFencedCode,
  insertImage,
  insertLink,
  insertTable,
  markdownToPlainText,
  wrapInline,
} from "@/lib/markdown-editor";

describe("markdown-editor transforms", () => {
  it("wraps selection with bold markers and placeholders", () => {
    const wrapped = wrapInline(
      { value: "hello", selectionStart: 0, selectionEnd: 5 },
      "**",
      "**",
      "bold text",
    );
    expect(wrapped.value).toBe("**hello**");
    expect(wrapped.selectionStart).toBe(2);
    expect(wrapped.selectionEnd).toBe(7);

    const empty = wrapInline(
      { value: "", selectionStart: 0, selectionEnd: 0 },
      "**",
      "**",
      "bold text",
    );
    expect(empty.value).toBe("**bold text**");
  });

  it("applies headings to the current line", () => {
    const result = applyHeading(
      { value: "Title", selectionStart: 0, selectionEnd: 5 },
      2,
    );
    expect(result.value).toBe("## Title");
  });

  it("prefixes list and task lines", () => {
    const bullet = applyLinePrefix(
      { value: "One\nTwo", selectionStart: 0, selectionEnd: 7 },
      "bullet",
    );
    expect(bullet.value).toBe("- One\n- Two");

    const task = applyLinePrefix(
      { value: "", selectionStart: 0, selectionEnd: 0 },
      "task",
    );
    expect(task.value).toBe("- [ ] Task");
  });

  it("inserts links, images, fences, and tables", () => {
    expect(
      insertLink(
        { value: "", selectionStart: 0, selectionEnd: 0 },
        "https://example.com",
        "Agenda",
      ).value,
    ).toBe("[Agenda](https://example.com)");

    expect(
      insertImage(
        { value: "", selectionStart: 0, selectionEnd: 0 },
        "https://example.com/a.png",
        "Alt",
      ).value,
    ).toBe("![Alt](https://example.com/a.png)");

    expect(
      insertFencedCode(
        { value: "x", selectionStart: 0, selectionEnd: 1 },
        "ts",
      ).value,
    ).toBe("```ts\nx\n```");

    expect(
      insertTable({ value: "", selectionStart: 0, selectionEnd: 0 }).value,
    ).toContain("| Column 1 |");
  });

  it("strips markdown for plain-text excerpts", () => {
    const plain = markdownToPlainText(
      "## Hello\n\n**bold** and [link](https://x.test)\n\n- item",
    );
    expect(plain).toBe("Hello bold and link item");
    expect(plain).not.toContain("**");
    expect(plain).not.toContain("https://");
  });
});
