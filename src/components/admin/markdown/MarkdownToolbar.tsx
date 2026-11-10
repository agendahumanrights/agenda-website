"use client";

import type { MarkdownEditorLabels } from "@/components/admin/markdown/labels";
import { cn } from "@/lib/utils";

type Props = {
  labels: MarkdownEditorLabels;
  disabled?: boolean;
  onHeading: (level: 1 | 2 | 3 | 4 | 5 | 6) => void;
  onBold: () => void;
  onItalic: () => void;
  onStrike: () => void;
  onBullet: () => void;
  onNumbered: () => void;
  onTask: () => void;
  onQuote: () => void;
  onLink: () => void;
  onImage: () => void;
  onInlineCode: () => void;
  onCodeBlock: () => void;
  onTable: () => void;
  onHr: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

function ToolButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded border border-transparent px-1.5 text-xs font-semibold text-zinc-700",
        "hover:border-zinc-300 hover:bg-white",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-900",
        "disabled:cursor-not-allowed disabled:opacity-40",
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return (
    <span className="mx-0.5 hidden h-5 w-px bg-zinc-200 sm:block" aria-hidden />
  );
}

export function MarkdownToolbar({
  labels,
  disabled,
  onHeading,
  onBold,
  onItalic,
  onStrike,
  onBullet,
  onNumbered,
  onTask,
  onQuote,
  onLink,
  onImage,
  onInlineCode,
  onCodeBlock,
  onTable,
  onHr,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: Props) {
  return (
    <div
      role="toolbar"
      aria-label={labels.write}
      className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 bg-zinc-50 px-1.5 py-1.5"
    >
      <ToolButton
        label={labels.undo}
        onClick={onUndo}
        disabled={disabled || !canUndo}
      >
        Undo
      </ToolButton>
      <ToolButton
        label={labels.redo}
        onClick={onRedo}
        disabled={disabled || !canRedo}
      >
        Redo
      </ToolButton>
      <Sep />
      <label className="inline-flex items-center gap-1 px-1 text-xs text-zinc-600">
        <span className="sr-only">{labels.heading}</span>
        <select
          aria-label={labels.heading}
          disabled={disabled}
          className="h-8 rounded border border-zinc-300 bg-white px-1.5 text-xs text-zinc-800"
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value;
            e.target.value = "";
            if (!v) return;
            onHeading(Number(v) as 1 | 2 | 3 | 4 | 5 | 6);
          }}
        >
          <option value="" disabled>
            H
          </option>
          <option value="1">{labels.heading1}</option>
          <option value="2">{labels.heading2}</option>
          <option value="3">{labels.heading3}</option>
          <option value="4">{labels.heading4}</option>
          <option value="5">{labels.heading5}</option>
          <option value="6">{labels.heading6}</option>
        </select>
      </label>
      <Sep />
      <ToolButton
        label={`${labels.bold} (Ctrl+B)`}
        onClick={onBold}
        disabled={disabled}
      >
        <span className="font-bold">B</span>
      </ToolButton>
      <ToolButton
        label={`${labels.italic} (Ctrl+I)`}
        onClick={onItalic}
        disabled={disabled}
      >
        <span className="italic">I</span>
      </ToolButton>
      <ToolButton
        label={labels.strikethrough}
        onClick={onStrike}
        disabled={disabled}
      >
        <span className="line-through">S</span>
      </ToolButton>
      <Sep />
      <ToolButton label={labels.bulletList} onClick={onBullet} disabled={disabled}>
        UL
      </ToolButton>
      <ToolButton
        label={labels.numberedList}
        onClick={onNumbered}
        disabled={disabled}
      >
        OL
      </ToolButton>
      <ToolButton label={labels.taskList} onClick={onTask} disabled={disabled}>
        Task
      </ToolButton>
      <ToolButton label={labels.quote} onClick={onQuote} disabled={disabled}>
        Quote
      </ToolButton>
      <Sep />
      <ToolButton label={labels.link} onClick={onLink} disabled={disabled}>
        Link
      </ToolButton>
      <ToolButton label={labels.image} onClick={onImage} disabled={disabled}>
        Image
      </ToolButton>
      <ToolButton
        label={labels.inlineCode}
        onClick={onInlineCode}
        disabled={disabled}
      >
        Code
      </ToolButton>
      <ToolButton
        label={labels.codeBlock}
        onClick={onCodeBlock}
        disabled={disabled}
      >
        Block
      </ToolButton>
      <ToolButton label={labels.table} onClick={onTable} disabled={disabled}>
        Table
      </ToolButton>
      <ToolButton
        label={labels.horizontalRule}
        onClick={onHr}
        disabled={disabled}
      >
        HR
      </ToolButton>
    </div>
  );
}
