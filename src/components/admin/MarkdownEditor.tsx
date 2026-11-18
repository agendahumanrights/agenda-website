"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";

import type { MarkdownEditorLabels } from "@/components/admin/markdown/labels";
import {
  MarkdownImageDialog,
  type MarkdownImageUploadConfig,
} from "@/components/admin/markdown/MarkdownImageDialog";
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
import type { AdminMediaRef } from "@/types/publication";

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
  /** When set, the Image dialog supports direct uploads for this purpose. */
  imageUpload?: MarkdownImageUploadConfig | null;
};

const HISTORY_LIMIT = 100;
const IMAGE_ACCEPT = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

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

function isImageFile(file: File | null | undefined): file is File {
  return Boolean(file && IMAGE_ACCEPT.has(file.type));
}

export function MarkdownEditor({
  id,
  value,
  onChange,
  dir = "ltr",
  disabled,
  rows = 14,
  labels,
  imageUpload = null,
}: Props) {
  const [mode, setMode] = useState<Mode>("write");
  const [expanded, setExpanded] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("https://");
  const [imageAltSeed, setImageAltSeed] = useState("");
  const [codeLang, setCodeLang] = useState("");
  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);
  const [inlineUploading, setInlineUploading] = useState(false);
  const narrow = useSyncExternalStore(
    subscribeNarrow,
    getNarrowSnapshot,
    getNarrowServerSnapshot,
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const skipHistoryRef = useRef(false);
  const pendingSelectionRef = useRef<EditorSelection | null>(null);
  const inlineUploadLockRef = useRef(false);

  const pushHistory = useCallback((previous: string) => {
    if (skipHistoryRef.current) return;
    setPast((prev) => {
      if (prev[prev.length - 1] === previous) return prev;
      return [...prev.slice(-(HISTORY_LIMIT - 1)), previous];
    });
    setFuture([]);
  }, []);

  const snapshotSelection = useCallback((): EditorSelection => {
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

  const getSelection = useCallback((): EditorSelection => {
    return pendingSelectionRef.current ?? snapshotSelection();
  }, [snapshotSelection]);

  const applyUpdate = useCallback(
    (update: EditorUpdate) => {
      const el = textareaRef.current;
      pushHistory(value);
      onChange(update.value);
      pendingSelectionRef.current = null;
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
    const sel = snapshotSelection();
    pendingSelectionRef.current = sel;
    const selected = sel.value.slice(sel.selectionStart, sel.selectionEnd);
    setLinkText(selected);
    setLinkUrl("https://");
    setDialog("link");
  };

  const openImageDialog = () => {
    const sel = snapshotSelection();
    pendingSelectionRef.current = sel;
    const selected = sel.value.slice(sel.selectionStart, sel.selectionEnd).trim();
    setImageAltSeed(selected);
    setDialog("image");
  };

  const openCodeDialog = () => {
    pendingSelectionRef.current = snapshotSelection();
    setCodeLang("");
    setDialog("code");
  };

  const confirmDialog = () => {
    if (dialog === "link") {
      const sel = pendingSelectionRef.current ?? snapshotSelection();
      applyUpdate(insertLink(sel, linkUrl, linkText));
    } else if (dialog === "code") {
      const sel = pendingSelectionRef.current ?? snapshotSelection();
      applyUpdate(insertFencedCode(sel, codeLang));
    }
    setDialog(null);
  };

  const insertUploadedImageAtSelection = useCallback(
    async (file: File, selection?: EditorSelection) => {
      if (!imageUpload || disabled || inlineUploadLockRef.current) return;
      inlineUploadLockRef.current = true;
      setInlineUploading(true);
      const sel = selection ?? snapshotSelection();
      pendingSelectionRef.current = sel;
      try {
        const form = new FormData();
        form.set("file", file);
        form.set("purpose", imageUpload.purpose);
        const res = await fetch("/api/admin/media/upload", {
          method: "POST",
          body: form,
          credentials: "same-origin",
        });
        const data = (await res.json().catch(() => null)) as {
          media?: AdminMediaRef;
        } | null;
        if (!res.ok || !data?.media?.url) return;
        const alt =
          sel.value.slice(sel.selectionStart, sel.selectionEnd).trim() ||
          "image";
        applyUpdate(insertImage(sel, data.media.url, alt));
      } finally {
        inlineUploadLockRef.current = false;
        setInlineUploading(false);
      }
    },
    [applyUpdate, disabled, imageUpload, snapshotSelection],
  );

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    if (!imageUpload || disabled) return;
    const items = Array.from(e.clipboardData?.items ?? []);
    const imageItem = items.find(
      (item) => item.kind === "file" && item.type.startsWith("image/"),
    );
    const file = imageItem?.getAsFile();
    if (!isImageFile(file)) return;
    e.preventDefault();
    void insertUploadedImageAtSelection(file, snapshotSelection());
  };

  const onDrop = (e: DragEvent<HTMLTextAreaElement>) => {
    if (!imageUpload || disabled) return;
    const file = Array.from(e.dataTransfer?.files ?? []).find(isImageFile);
    if (!file) return;
    e.preventDefault();
    void insertUploadedImageAtSelection(file, snapshotSelection());
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
  const editorDisabled = disabled || inlineUploading;

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
              disabled={editorDisabled}
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
            disabled={editorDisabled}
            onClick={() => setHelpOpen((v) => !v)}
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
            aria-expanded={helpOpen}
          >
            {labels.help}
          </button>
          <button
            type="button"
            disabled={editorDisabled}
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
          disabled={editorDisabled}
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
            disabled={editorDisabled}
            rows={expanded ? undefined : rows}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onDragOver={(e) => {
              if (!imageUpload || disabled) return;
              if (Array.from(e.dataTransfer?.types ?? []).includes("Files")) {
                e.preventDefault();
              }
            }}
            onDrop={onDrop}
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
        onCancel={() => {
          pendingSelectionRef.current = null;
          setDialog(null);
        }}
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
      <MarkdownImageDialog
        key={dialog === "image" ? `image-open-${imageAltSeed}` : "image-closed"}
        open={dialog === "image"}
        upload={imageUpload}
        initialAlt={imageAltSeed}
        disabled={editorDisabled}
        labels={{
          title: labels.imageDialogTitle,
          alt: labels.imageAlt,
          url: labels.imageUrl,
          captionOptional: labels.imageCaptionOptional,
          tabUpload: labels.imageTabUpload,
          tabUrl: labels.imageTabUrl,
          dropHint: labels.imageDropHint,
          fileHint: labels.imageFileHint,
          uploading: labels.imageUploading,
          uploadFailed: labels.imageUploadFailed,
          insert: labels.insert,
          cancel: labels.cancel,
          previewAlt: labels.imagePreviewAlt,
        }}
        onCancel={() => {
          pendingSelectionRef.current = null;
          setDialog(null);
        }}
        onInsert={({ url, alt, title }) => {
          const sel = pendingSelectionRef.current ?? snapshotSelection();
          applyUpdate(insertImage(sel, url, alt, title));
          setDialog(null);
        }}
      />
      <MarkdownPromptDialog
        open={dialog === "code"}
        title={labels.codeBlock}
        confirmLabel={labels.insert}
        cancelLabel={labels.cancel}
        onCancel={() => {
          pendingSelectionRef.current = null;
          setDialog(null);
        }}
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
