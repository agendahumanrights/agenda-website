"use client";

import { useMemo, useState } from "react";

import { MAX_PUBLICATION_AUTHORS } from "@/lib/publications/authors";
import { cn } from "@/lib/utils";

export type PublicationAuthorOption = {
  id: string;
  fullName: string;
  profileImageUrl?: string | null;
};

type Labels = {
  authors: string;
  addAuthor: string;
  selectedAuthors: string;
  authorsMax: string;
  removeAuthor: string;
  authorSearchPlaceholder: string;
  authorEmpty: string;
  authorNone: string;
  moveUp: string;
  moveDown: string;
};

type Props = {
  id: string;
  writers: PublicationAuthorOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  labels: Labels;
  disabled?: boolean;
  required?: boolean;
  error?: string | null;
};

function Portrait({
  url,
  name,
}: {
  url: string | null | undefined;
  name: string;
}) {
  if (!url) {
    return (
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[0.65rem] font-semibold text-zinc-500"
        aria-hidden
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  return (
    <span className="size-8 shrink-0 overflow-hidden rounded-full bg-zinc-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="size-full object-cover" />
    </span>
  );
}

export function PublicationAuthorsField({
  id,
  writers,
  selectedIds,
  onChange,
  labels,
  disabled = false,
  required = false,
  error,
}: Props) {
  const [query, setQuery] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const atMax = selectedIds.length >= MAX_PUBLICATION_AUTHORS;

  const writerById = useMemo(() => {
    const map = new Map<string, PublicationAuthorOption>();
    for (const writer of writers) map.set(writer.id, writer);
    return map;
  }, [writers]);

  const selected = selectedIds
    .map((writerId) => writerById.get(writerId))
    .filter((w): w is PublicationAuthorOption => Boolean(w));

  const available = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    const q = query.trim().toLowerCase();
    return writers.filter((writer) => {
      if (selectedSet.has(writer.id)) return false;
      if (!q) return true;
      return writer.fullName.toLowerCase().includes(q);
    });
  }, [writers, selectedIds, query]);

  function addAuthor(writerId: string) {
    if (disabled || atMax || selectedIds.includes(writerId)) return;
    onChange([...selectedIds, writerId]);
    setQuery("");
  }

  function removeAuthor(writerId: string) {
    if (disabled) return;
    onChange(selectedIds.filter((idValue) => idValue !== writerId));
  }

  function moveAuthor(from: number, to: number) {
    if (disabled || to < 0 || to >= selectedIds.length) return;
    const next = selectedIds.slice();
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    onChange(next);
  }

  function onDrop(toIndex: number) {
    if (dragIndex === null || dragIndex === toIndex) {
      setDragIndex(null);
      return;
    }
    moveAuthor(dragIndex, toIndex);
    setDragIndex(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium text-zinc-500">
          {labels.selectedAuthors}:{" "}
          <span className="tabular-nums text-zinc-800">
            {selectedIds.length} / {MAX_PUBLICATION_AUTHORS}
          </span>
        </p>
        {atMax ? (
          <p className="text-xs text-amber-800">{labels.authorsMax}</p>
        ) : null}
      </div>

      {selected.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
          {labels.authorNone}
        </p>
      ) : (
        <ul className="flex list-none flex-col gap-2">
          {selected.map((writer, index) => (
            <li
              key={writer.id}
              draggable={!disabled}
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(index)}
              className={cn(
                "flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-2",
                dragIndex === index && "opacity-60",
              )}
            >
              <span
                className="cursor-grab text-zinc-400 active:cursor-grabbing"
                aria-hidden
                title="Drag to reorder"
              >
                ⋮⋮
              </span>
              <Portrait url={writer.profileImageUrl} name={writer.fullName} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900">
                {writer.fullName}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  className="rounded px-1.5 py-1 text-xs text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
                  disabled={disabled || index === 0}
                  onClick={() => moveAuthor(index, index - 1)}
                  aria-label={labels.moveUp}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="rounded px-1.5 py-1 text-xs text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
                  disabled={disabled || index === selected.length - 1}
                  onClick={() => moveAuthor(index, index + 1)}
                  aria-label={labels.moveDown}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="rounded px-1.5 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-40"
                  disabled={disabled}
                  onClick={() => removeAuthor(writer.id)}
                  aria-label={`${labels.removeAuthor}: ${writer.fullName}`}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {writers.length === 0 ? (
        <p className="text-sm text-amber-800">{labels.authorEmpty}</p>
      ) : (
        <div className="flex flex-col gap-2">
          <label htmlFor={`${id}-search`} className="sr-only">
            {labels.addAuthor}
          </label>
          <input
            id={`${id}-search`}
            type="search"
            className="admin-control"
            value={query}
            disabled={disabled || atMax}
            placeholder={labels.authorSearchPlaceholder}
            aria-required={required || undefined}
            aria-invalid={error ? true : undefined}
            onChange={(e) => setQuery(e.target.value)}
          />
          {!atMax && (query.trim() || available.length <= 8) ? (
            <ul className="max-h-44 list-none overflow-y-auto rounded-lg border border-zinc-200 bg-white">
              {available.length === 0 ? (
                <li className="px-3 py-2 text-sm text-zinc-500">
                  {labels.authorEmpty}
                </li>
              ) : (
                available.slice(0, 12).map((writer) => (
                  <li key={writer.id} className="border-b border-zinc-100 last:border-0">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm hover:bg-zinc-50 disabled:opacity-50"
                      disabled={disabled}
                      onClick={() => addAuthor(writer.id)}
                    >
                      <Portrait
                        url={writer.profileImageUrl}
                        name={writer.fullName}
                      />
                      <span className="min-w-0 truncate font-medium text-zinc-900">
                        {writer.fullName}
                      </span>
                      <span className="ms-auto shrink-0 text-xs text-[var(--brand-blue)]">
                        {labels.addAuthor}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      )}

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
