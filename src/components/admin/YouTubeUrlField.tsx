"use client";

import { useMemo } from "react";

import { YouTubeEmbed } from "@/components/shared/YouTubeEmbed";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { isValidYouTubeUrl, parseYouTubeUrl } from "@/lib/youtube";
import { cn } from "@/lib/utils";

export type YouTubeUrlFieldLabels = {
  youtubeSection: string;
  youtubeOptional: string;
  youtubeHint: string;
  youtubeUrl: string;
  youtubePlaceholder: string;
  youtubeInvalid: string;
  youtubeRemove: string;
  youtubeEmpty: string;
};

type Props = {
  id: string;
  value: string;
  disabled?: boolean;
  labels: YouTubeUrlFieldLabels;
  onChange: (next: string) => void;
  className?: string;
};

export function YouTubeUrlField({
  id,
  value,
  disabled,
  labels,
  onChange,
  className,
}: Props) {
  const trimmed = value.trim();
  const parsed = useMemo(
    () => (trimmed ? parseYouTubeUrl(trimmed) : null),
    [trimmed],
  );
  const showInvalid = trimmed.length > 0 && !parsed;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <h3 className="text-sm font-semibold text-zinc-800">
        {labels.youtubeSection}{" "}
        <span className="font-normal text-zinc-500">
          ({labels.youtubeOptional})
        </span>
      </h3>
      <p className="text-xs text-zinc-500">{labels.youtubeHint}</p>

      <FormField
        id={id}
        label={labels.youtubeUrl}
        error={showInvalid ? labels.youtubeInvalid : undefined}
      >
        <Input
          id={id}
          type="url"
          inputMode="url"
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
          placeholder={labels.youtubePlaceholder}
          className="admin-control"
          value={value}
          disabled={disabled}
          aria-invalid={showInvalid || undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      </FormField>

      {parsed ? (
        <div className="flex flex-col gap-2">
          <YouTubeEmbed
            url={parsed.canonicalUrl}
            title={labels.youtubeSection}
            loading="lazy"
          />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              className="min-h-9 text-red-700"
              disabled={disabled}
              onClick={() => onChange("")}
            >
              {labels.youtubeRemove}
            </Button>
          </div>
        </div>
      ) : !trimmed ? (
        <p className="rounded-xl border border-dashed border-[var(--admin-border)] bg-zinc-50/80 px-4 py-5 text-center text-xs text-zinc-500">
          {labels.youtubeEmpty}
        </p>
      ) : null}
    </div>
  );
}

export function youtubeUrlForPayload(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!isValidYouTubeUrl(trimmed)) {
    throw new Error("INVALID_YOUTUBE_URL");
  }
  return parseYouTubeUrl(trimmed)!.canonicalUrl;
}
