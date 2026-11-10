"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";

import type { MarkdownEditorLabels } from "@/components/admin/markdown/labels";
import { MarkdownPromptDialog } from "@/components/admin/markdown/MarkdownPromptDialog";
import { MarkdownToolbar } from "@/components/admin/markdown/MarkdownToolbar";
import { MarkdownContent } from "@/components/shared/MarkdownContent";
import { cn } from "@/lib/utils";
import {
  applyHeading,
  applyLinePrefix,
  insertFencedCode,
  insertHorizontalRule,
  insertImage,
  insertLink,
  insertTable,
  wrapInline,
  type EditorSelection,
  type EditorUpdate,
} from "@/lib/markdown-editor";

type Mode = "write" | "preview" | "split";

type DialogKind = "link" | "image" | "code" | null;

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  dir?: "rtl" | "ltr";
  disabled?: boolean;
  rows?: number;
  labels: MarkdownEditorLabels;
};

const HISTORY_LIMIT = 100;

function subscribeNarrow(onStoreChange: () => void) {
  const mq = window.matchMedia("(max-width: 767px)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getNarrowSnapshot() {
  return window.matchMedia("(max-width: 767px)").matches;
}

function getNarrowServerSnapshot() {
  return false;
}

export function MarkdownEditor({
  id,
  value,
  onChange,
  dir = "ltr",
  disabled,
  rows = 14,
  labels,
}: Props) {
  const [mode, setMode] = useState<Mode>("write");
  const [expanded, setExpanded] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("https://");
  const [imageAlt, setImageAlt] = useState("");
  const [imageUrl, setImageUrl] = useState("https://");
  const [codeLang, setCodeLang] = useState("");
  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);
  const narrow = useSyncExternalStore(
    subscribeNarrow,
    getNarrowSnapshot,
    getNarrowServerSnapshot,
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const skipHistoryRef = useRef(false);

  const pushHistory = useCallback((previous: string) => {
    if (skipHistoryRef.current) return;
    setPast((prev) => {
      if (prev[prev.length - 1] === previous) return prev;
      return [...prev.slice(-(HISTORY_LIMIT - 1)), previous];
    });
    setFuture([]);
  }, []);

  const getSelection = useCallback((): EditorSelection => {
    const el = textareaRef.current;
    if (!el) {
      return { value, selectionStart: value.length, selectionEnd: value.length };
    }
    return {
      value: el.value,
      selectionStart: el.selectionStart,
      selectionEnd: el.selectionEnd,
    };
  }, [value]);

  const applyUpdate = useCallback(
    (update: EditorUpdate) => {
      const el = textareaRef.current;
      pushHistory(value);
      onChange(update.value);
      requestAnimationFrame(() => {
        const target = textareaRef.current ?? el;
        if (!target) return;
        target.focus();
        target.setSelectionRange(update.selectionStart, update.selectionEnd);
      });
    },
    [onChange, pushHistory, value],
  );

  const run = useCallback(
    (fn: (sel: EditorSelection) => EditorUpdate) => {
      if (disabled) return;
      applyUpdate(fn(getSelection()));
    },
    [applyUpdate, disabled, getSelection],
  );

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1]!;
    setPast((prev) => prev.slice(0, -1));
    setFuture((prev) => [...prev, value]);
    skipHistoryRef.current = true;
    onChange(previous);
    skipHistoryRef.current = false;
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      const pos = previous.length;
      el.setSelectionRange(pos, pos);
    });
  }, [onChange, past, value]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[future.length - 1]!;
    setFuture((prev) => prev.slice(0, -1));
    setPast((prev) => [...prev, value]);
    skipHistoryRef.current = true;
    onChange(next);
    skipHistoryRef.current = false;
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      const pos = next.length;
      el.setSelectionRange(pos, pos);
    });
  }, [future, onChange, value]);

  const onTextChange = useCallback(
    (next: string) => {
      pushHistory(value);
      onChange(next);
    },
    [onChange, pushHistory, value],
  );

  const openLinkDialog = () => {
    const sel = getSelection();
    const selected = sel.value.slice(sel.selectionStart, sel.selectionEnd);
    setLinkText(selected);
    setLinkUrl("https://");
    setDialog("link");
  };

  const openImageDialog = () => {
    setImageAlt("");
    setImageUrl("https://");
    setDialog("image");
  };

  const openCodeDialog = () => {
    setCodeLang("");
    setDialog("code");
  };

  const confirmDialog = () => {
    if (dialog === "link") {
      run((sel) => insertLink(sel, linkUrl, linkText));
    } else if (dialog === "image") {
      run((sel) => insertImage(sel, imageUrl, imageAlt));
    } else if (dialog === "code") {
      run((sel) => insertFencedCode(sel, codeLang));
    }
    setDialog(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;
    const key = e.key.toLowerCase();
    if (key === "b") {
      e.preventDefault();
      run((sel) => wrapInline(sel, "**", "**", "bold text"));
    } else if (key === "i") {
      e.preventDefault();
      run((sel) => wrapInline(sel, "*", "*", "italic text"));
    } else if (key === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if (key === "y" || (key === "z" && e.shiftKey)) {
      e.preventDefault();
      redo();
    }
  };

  const effectiveMode: Mode = narrow && mode === "split" ? "write" : mode;
  const showEditor = effectiveMode === "write" || effectiveMode === "split";
  const showPreview = effectiveMode === "preview" || effectiveMode === "split";

  const modeButtons: Array<{ key: Mode; label: string }> = useMemo(() => {
    const buttons: Array<{ key: Mode; label: string }> = [
      { key: "write", label: labels.write },
      { key: "preview", label: labels.preview },
    ];
    if (!narrow) buttons.push({ key: "split", label: labels.split });
    return buttons;
  }, [labels.preview, labels.split, labels.write, narrow]);

  const shell = (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded border border-zinc-300 bg-white",
        expanded && "h-full",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-2 py-1.5">
        <div className="flex flex-wrap gap-1 text-sm">
          {modeButtons.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => setMode(key)}
              className={cn(
                "rounded border px-2.5 py-1 text-xs font-medium",
                effectiveMode === key
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setHelpOpen((v) => !v)}
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
            aria-expanded={helpOpen}
          >
            {labels.help}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setExpanded((v) => !v)}
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          >
            {expanded ? labels.collapse : labels.expand}
          </button>
        </div>
      </div>

      {helpOpen ? (
        <div className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-xs leading-relaxed text-zinc-600 whitespace-pre-wrap">
          <p className="font-semibold text-zinc-800">{labels.helpTitle}</p>
          <p className="mt-1">{labels.helpBody}</p>
        </div>
      ) : null}

      {showEditor ? (
        <MarkdownToolbar
          labels={labels}
          disabled={disabled}
          canUndo={past.length > 0}
          canRedo={future.length > 0}
          onUndo={undo}
          onRedo={redo}
          onHeading={(level) => run((sel) => applyHeading(sel, level))}
          onBold={() => run((sel) => wrapInline(sel, "**", "**", "bold text"))}
          onItalic={() => run((sel) => wrapInline(sel, "*", "*", "italic text"))}
          onStrike={() =>
            run((sel) => wrapInline(sel, "~~", "~~", "strikethrough"))
          }
          onBullet={() => run((sel) => applyLinePrefix(sel, "bullet"))}
          onNumbered={() => run((sel) => applyLinePrefix(sel, "numbered"))}
          onTask={() => run((sel) => applyLinePrefix(sel, "task"))}
          onQuote={() => run((sel) => applyLinePrefix(sel, "quote"))}
          onLink={openLinkDialog}
          onImage={openImageDialog}
          onInlineCode={() =>
            run((sel) => wrapInline(sel, "`", "`", "code"))
          }
          onCodeBlock={openCodeDialog}
          onTable={() => run((sel) => insertTable(sel))}
          onHr={() => run((sel) => insertHorizontalRule(sel))}
        />
      ) : null}

      <div
        className={cn(
          "grid min-h-0 flex-1",
          effectiveMode === "split" ? "md:grid-cols-2" : "grid-cols-1",
        )}
      >
        {showEditor ? (
          <textarea
            ref={textareaRef}
            id={id}
            value={value}
            dir={dir}
            disabled={disabled}
            rows={expanded ? undefined : rows}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck
            className={cn(
              "w-full resize-y border-0 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none",
              "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900",
              effectiveMode === "split" && "md:border-e md:border-zinc-200",
              expanded ? "min-h-[min(70vh,40rem)] flex-1 resize-none" : "",
            )}
          />
        ) : null}
        {showPreview ? (
          <div
            dir={dir}
            className={cn(
              "overflow-auto bg-zinc-50 px-3 py-3",
              expanded ? "min-h-[min(70vh,40rem)]" : "min-h-[12rem]",
            )}
          >
            {value.trim() ? (
              <MarkdownContent
                source={value}
                shiftHeadings
                className="article-prose"
              />
            ) : (
              <p className="text-sm text-zinc-500">{labels.emptyPreview}</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      {expanded ? (
        <div className="fixed inset-0 z-[70] flex flex-col bg-white p-3 sm:p-5">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col">
            {shell}
          </div>
        </div>
      ) : (
        shell
      )}

      <MarkdownPromptDialog
        open={dialog === "link"}
        title={labels.linkDialogTitle}
        confirmLabel={labels.insert}
        cancelLabel={labels.cancel}
        onCancel={() => setDialog(null)}
        onConfirm={confirmDialog}
        fields={[
          {
            id: `${id}-link-text`,
            label: labels.linkText,
            value: linkText,
            onChange: setLinkText,
          },
          {
            id: `${id}-link-url`,
            label: labels.linkUrl,
            value: linkUrl,
            onChange: setLinkUrl,
            placeholder: "https://",
          },
        ]}
      />
      <MarkdownPromptDialog
        open={dialog === "image"}
        title={labels.imageDialogTitle}
        confirmLabel={labels.insert}
        cancelLabel={labels.cancel}
        onCancel={() => setDialog(null)}
        onConfirm={confirmDialog}
        fields={[
          {
            id: `${id}-image-alt`,
            label: labels.imageAlt,
            value: imageAlt,
            onChange: setImageAlt,
          },
          {
            id: `${id}-image-url`,
            label: labels.imageUrl,
            value: imageUrl,
            onChange: setImageUrl,
            placeholder: "https://",
          },
        ]}
      />
      <MarkdownPromptDialog
        open={dialog === "code"}
        title={labels.codeBlock}
        confirmLabel={labels.insert}
        cancelLabel={labels.cancel}
        onCancel={() => setDialog(null)}
        onConfirm={confirmDialog}
        fields={[
          {
            id: `${id}-code-lang`,
            label: labels.codeLanguage,
            value: codeLang,
            onChange: setCodeLang,
            hint: labels.codeLanguageHint,
            placeholder: "ts",
          },
        ]}
      />
    </>
  );
}
