"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import dynamic from "next/dynamic";

import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import type { MarkdownEditorLabels } from "@/components/admin/markdown/labels";

const MarkdownEditor = dynamic(
  () =>
    import("@/components/admin/MarkdownEditor").then((m) => m.MarkdownEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[12rem] animate-pulse rounded-md border border-zinc-200 bg-zinc-50" />
    ),
  },
);
import { MediaDropzone } from "@/components/admin/MediaDropzone";
import {
  YouTubeUrlField,
  youtubeUrlForPayload,
} from "@/components/admin/YouTubeUrlField";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { adminJson } from "@/lib/admin-api";
import {
  countContentImages,
  remainingContentImageSlots,
} from "@/lib/content-image-limits";
import { toDateInputValue } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { isValidYouTubeUrl } from "@/lib/youtube";
import type { Dictionary } from "@/i18n/dictionaries";
import type { AdminMediaRef } from "@/types/publication";
import type { AdminEventDetail } from "@/types/event";

type Labels = Dictionary["admin"]["evt"];

type EventMediaLimits = {
  maxImageBytes: number;
  maxImagesPerItem: number;
  maxGalleryImages: number;
};

type Props = {
  mode: "create" | "edit";
  labels: Labels;
  markdownLabels: MarkdownEditorLabels;
  locale: string;
  mediaLimits: EventMediaLimits;
  initial?: AdminEventDetail | null;
};

type TranslationState = {
  title: string;
  subtitle: string;
  description: string;
};

type ContentLocale = "ar" | "en";

function emptyTranslation(): TranslationState {
  return { title: "", subtitle: "", description: "" };
}

export function EventForm({
  mode,
  labels,
  markdownLabels,
  locale,
  mediaLimits,
  initial,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [contentLocale, setContentLocale] = useState<ContentLocale>("ar");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [eventDate, setEventDate] = useState(
    toDateInputValue(initial?.eventDate) || toDateInputValue(new Date()),
  );
  const [slugPreview, setSlugPreview] = useState(initial?.slug ?? "");
  const [ar, setAr] = useState<TranslationState>(() => {
    const t = initial?.translations.find((x) => x.locale === "ar");
    return t
      ? { title: t.title, subtitle: t.subtitle, description: t.description }
      : emptyTranslation();
  });
  const [en, setEn] = useState<TranslationState>(() => {
    const t = initial?.translations.find((x) => x.locale === "en");
    return t
      ? { title: t.title, subtitle: t.subtitle, description: t.description }
      : emptyTranslation();
  });
  const [mainImage, setMainImage] = useState<AdminMediaRef | null>(
    initial?.mainImage ?? null,
  );
  const [gallery, setGallery] = useState<AdminMediaRef[]>(
    initial?.gallery ?? [],
  );
  const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtubeUrl ?? "");
  const [featureOnHomepage, setFeatureOnHomepage] = useState(
    initial?.isFeatured ?? false,
  );
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");

  const titleArRef = useRef<HTMLInputElement>(null);
  const titleEnRef = useRef<HTMLInputElement>(null);

  const isPublished = status === "PUBLISHED";
  const displayTitle =
    (contentLocale === "ar" ? ar.title : en.title) ||
    ar.title ||
    en.title ||
    initial?.slug ||
    labels.newTitle;

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = labels.unsavedWarning;
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, labels.unsavedWarning]);

  function buildBodyPayload(nextYoutubeUrl: string | null) {
    return {
      eventDate: new Date(`${eventDate}T12:00:00.000Z`).toISOString(),
      mainImageId: mainImage?.id ?? null,
      youtubeUrl: nextYoutubeUrl,
      galleryImageIds: gallery.map((g) => g.id),
      translations: [
        { locale: "ar" as const, ...ar },
        { locale: "en" as const, ...en },
      ],
      featureOnHomepage,
    };
  }

  function markDirty() {
    setDirty(true);
    setMessage(null);
    setError(null);
  }

  function validateForPublish(): Record<string, string> {
    const next: Record<string, string> = {};
    if (!ar.title.trim() || !ar.subtitle.trim() || !ar.description.trim()) {
      next.ar = labels.errorValidation;
    }
    if (!en.title.trim() || !en.subtitle.trim() || !en.description.trim()) {
      next.en = labels.errorValidation;
    }
    if (!mainImage) next.mainImage = labels.errorValidation;
    if (!eventDate) next.eventDate = labels.errorValidation;
    return next;
  }

  function focusFirstError(errs: Record<string, string>) {
    if (errs.ar) {
      setContentLocale("ar");
      requestAnimationFrame(() => titleArRef.current?.focus());
      return;
    }
    if (errs.en) {
      setContentLocale("en");
      requestAnimationFrame(() => titleEnRef.current?.focus());
    }
  }

  async function uploadFile(
    file: File,
    purpose: "event-main" | "event-gallery",
  ): Promise<AdminMediaRef | null> {
    setUploading(true);
    setMediaError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("purpose", purpose);
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => null)) as {
        media?: AdminMediaRef;
        error?: { message?: string };
      } | null;
      if (!res.ok || !data?.media) {
        const msg = data?.error?.message || labels.errorGeneric;
        setMediaError(msg);
        setError(msg);
        return null;
      }
      return data.media;
    } catch {
      setMediaError(labels.errorGeneric);
      setError(labels.errorGeneric);
      return null;
    } finally {
      setUploading(false);
    }
  }

  function submit(nextStatus: "DRAFT" | "PUBLISHED") {
    if (pending || uploading) return;
    setError(null);

    let normalizedYoutube: string | null = null;
    if (youtubeUrl.trim()) {
      if (!isValidYouTubeUrl(youtubeUrl)) {
        setError(labels.youtubeInvalid);
        return;
      }
      try {
        normalizedYoutube = youtubeUrlForPayload(youtubeUrl);
      } catch {
        setError(labels.youtubeInvalid);
        return;
      }
    }

    if (nextStatus === "PUBLISHED") {
      const errs = validateForPublish();
      setFieldErrors(errs);
      if (Object.keys(errs).length > 0) {
        setError(labels.errorValidation);
        focusFirstError(errs);
        return;
      }
    } else {
      setFieldErrors({});
    }

    const payload = {
      ...buildBodyPayload(normalizedYoutube),
      status: nextStatus,
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await adminJson<{ event: AdminEventDetail }>(
              "/api/admin/events",
              { method: "POST", body: JSON.stringify(payload) },
            )
          : await adminJson<{ event: AdminEventDetail }>(
              `/api/admin/events/${initial!.id}`,
              { method: "PATCH", body: JSON.stringify(payload) },
            );

      if (!result.ok) {
        if (result.status === 409) setError(labels.errorConflict);
        else if (result.status === 400) {
          setError(result.payload.error?.message || labels.errorValidation);
        } else setError(labels.errorGeneric);
        return;
      }

      setDirty(false);
      setStatus(result.data.event.status);
      setYoutubeUrl(result.data.event.youtubeUrl ?? "");
      setMessage(
        nextStatus === "PUBLISHED"
          ? labels.successPublished
          : isPublished && nextStatus === "DRAFT"
            ? labels.successUnpublished
            : labels.successSaved,
      );
      if (mode === "create") {
        router.push(`/admin/events/${result.data.event.id}/edit`);
        router.refresh();
      } else {
        setSlugPreview(result.data.event.slug);
        setFeatureOnHomepage(result.data.event.isFeatured);
        router.refresh();
      }
    });
  }

  const imageMaxMb = Math.round(mediaLimits.maxImageBytes / (1024 * 1024));
  const busy = pending || uploading;
  const imageCount = countContentImages(Boolean(mainImage), gallery.length);
  const remainingImageSlots = remainingContentImageSlots(
    Boolean(mainImage),
    gallery.length,
    mediaLimits.maxImagesPerItem,
  );
  const imagesAtLimit = remainingImageSlots === 0;
  const canAddMainImage = !mainImage && remainingImageSlots > 0;
  const active = contentLocale === "ar" ? ar : en;
  const setActive = contentLocale === "ar" ? setAr : setEn;

  const publishPanel = (
    <div className="admin-panel flex flex-col gap-3 p-4 sm:p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {labels.sectionPublish}
      </h2>
      {dirty ? (
        <p className="text-xs font-medium text-amber-800" role="status">
          {labels.unsavedIndicator}
        </p>
      ) : null}
      {message ? (
        <p
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          role="status"
        >
          {message}
        </p>
      ) : null}
      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        {mode === "create" || !isPublished ? (
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => submit("DRAFT")}
            >
              {busy ? labels.saving : labels.saveDraft}
            </Button>
            <Button
              type="button"
              variant="brand"
              disabled={busy}
              onClick={() => submit("PUBLISHED")}
            >
              {busy ? labels.saving : labels.publish}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="brand"
              disabled={busy}
              onClick={() => submit("PUBLISHED")}
            >
              {busy ? labels.saving : labels.saveChanges}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => setConfirmUnpublish(true)}
            >
              {labels.unpublish}
            </Button>
          </>
        )}
        {mode === "edit" && !isPublished ? (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => submit("DRAFT")}
          >
            {busy ? labels.saving : labels.saveChanges}
          </Button>
        ) : null}
      </div>
      {uploading ? (
        <p className="text-xs text-zinc-500">{labels.uploading}</p>
      ) : null}
    </div>
  );

  return (
    <>
      <form
        className="flex flex-col gap-6 pb-28 lg:pb-8"
        onSubmit={(e) => e.preventDefault()}
      >
        <nav aria-label={labels.breadcrumbs} className="text-sm text-zinc-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link
                href="/admin/events"
                className="hover:text-[var(--brand-blue)] hover:underline"
              >
                {labels.backToList}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-medium text-zinc-800">
              {mode === "create" ? labels.newTitle : labels.editTitle}
            </li>
          </ol>
        </nav>

        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                {mode === "create" ? labels.newTitle : labels.editTitle}
              </h1>
              {mode === "edit" ? (
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    isPublished
                      ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                      : "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
                  )}
                >
                  {isPublished ? labels.statusPublished : labels.statusDraft}
                </span>
              ) : null}
            </div>
            <p className="mt-1 max-w-2xl text-sm text-[var(--admin-muted)]">
              {labels.uiLanguageNote}
            </p>
            {mode === "edit" && displayTitle ? (
              <p className="mt-1 truncate text-sm font-medium text-zinc-700">
                {displayTitle}
              </p>
            ) : null}
          </div>
          <Link
            href="/admin/events"
            className="text-sm font-medium text-[var(--brand-blue)] hover:underline"
          >
            {labels.backToList}
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)] lg:items-start">
          <div className="flex min-w-0 flex-col gap-6">
            <section className="admin-panel p-4 sm:p-5">
              <h2 className="text-base font-semibold text-zinc-900">
                {labels.sectionContent}
              </h2>
              <div
                role="tablist"
                aria-label={labels.sectionContent}
                className="mt-4 flex gap-1 rounded-lg bg-zinc-100 p-1"
              >
                {(
                  [
                    ["ar", labels.tabAr, fieldErrors.ar],
                    ["en", labels.tabEn, fieldErrors.en],
                  ] as const
                ).map(([key, label, err]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={contentLocale === key}
                    className={cn(
                      "relative min-h-10 flex-1 rounded-md px-3 text-sm font-medium transition-colors",
                      contentLocale === key
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-600 hover:text-zinc-900",
                    )}
                    onClick={() => setContentLocale(key)}
                  >
                    {label}
                    {err ? (
                      <span
                        className="ms-1 inline-block size-2 rounded-full bg-red-500 align-middle"
                        title={labels.tabHasErrors}
                      >
                        <span className="sr-only">{labels.tabHasErrors}</span>
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>

              <div
                role="tabpanel"
                className="mt-5 flex flex-col gap-4"
                dir={contentLocale === "ar" ? "rtl" : "ltr"}
              >
                <FormField
                  id={`title-${contentLocale}`}
                  label={labels.title}
                  error={
                    fieldErrors[contentLocale] && !active.title.trim()
                      ? labels.errorValidation
                      : undefined
                  }
                >
                  <Input
                    ref={contentLocale === "ar" ? titleArRef : titleEnRef}
                    id={`title-${contentLocale}`}
                    dir={contentLocale === "ar" ? "rtl" : "ltr"}
                    className="admin-control"
                    value={active.title}
                    disabled={busy}
                    onChange={(e) => {
                      markDirty();
                      setActive((s) => ({ ...s, title: e.target.value }));
                    }}
                  />
                </FormField>
                <FormField
                  id={`subtitle-${contentLocale}`}
                  label={labels.subtitle}
                >
                  <Input
                    id={`subtitle-${contentLocale}`}
                    dir={contentLocale === "ar" ? "rtl" : "ltr"}
                    className="admin-control"
                    value={active.subtitle}
                    disabled={busy}
                    onChange={(e) => {
                      markDirty();
                      setActive((s) => ({ ...s, subtitle: e.target.value }));
                    }}
                  />
                </FormField>
                <FormField
                  id={`desc-${contentLocale}`}
                  label={labels.description}
                >
                  <MarkdownEditor
                    id={`desc-${contentLocale}`}
                    dir={contentLocale === "ar" ? "rtl" : "ltr"}
                    value={active.description}
                    disabled={busy}
                    labels={markdownLabels}
                    onChange={(value) => {
                      markDirty();
                      setActive((s) => ({ ...s, description: value }));
                    }}
                  />
                </FormField>
              </div>
            </section>

            <section className="admin-panel flex flex-col gap-6 p-4 sm:p-5">
              <h2 className="text-base font-semibold text-zinc-900">
                {labels.sectionMedia}
              </h2>

              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-zinc-800">
                  {labels.mainImage}
                </h3>
                {mainImage ? (
                  <div className="overflow-hidden rounded-xl border border-[var(--admin-border)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mainImage.url}
                      alt=""
                      className="max-h-72 w-full object-cover"
                    />
                    <div className="flex flex-wrap gap-2 border-t border-[var(--admin-border)] bg-zinc-50 px-3 py-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-9"
                        disabled={busy}
                        onClick={() =>
                          document.getElementById("evt-main-replace")?.click()
                        }
                      >
                        {labels.replace}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-9"
                        disabled={busy}
                        onClick={() => {
                          markDirty();
                          setMainImage(null);
                        }}
                      >
                        {labels.remove}
                      </Button>
                      <input
                        id="evt-main-replace"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="sr-only"
                        disabled={busy}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (!file) return;
                          const prev = mainImage;
                          const asset = await uploadFile(file, "event-main");
                          if (asset) {
                            markDirty();
                            setMainImage(asset);
                          } else if (prev) {
                            setMainImage(prev);
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : canAddMainImage ? (
                  <MediaDropzone
                    id="evt-main-image"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    disabled={busy}
                    dropHint={labels.dropHint}
                    hint={labels.mainImageHint.replace(
                      "{maxMb}",
                      String(imageMaxMb),
                    )}
                    error={fieldErrors.mainImage || mediaError}
                    onFile={async (file) => {
                      const asset = await uploadFile(file, "event-main");
                      if (asset) {
                        markDirty();
                        setMainImage(asset);
                      }
                    }}
                  />
                ) : (
                  <p className="text-xs text-amber-800" role="status">
                    {labels.imagesAtLimit.replace(
                      "{max}",
                      String(mediaLimits.maxImagesPerItem),
                    )}
                  </p>
                )}
                {fieldErrors.mainImage && !canAddMainImage && !mainImage ? (
                  <p className="text-xs text-red-600" role="alert">
                    {fieldErrors.mainImage}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-zinc-800">
                    {labels.gallery}
                  </h3>
                  <p
                    className="text-xs font-medium text-zinc-600"
                    aria-live="polite"
                  >
                    {labels.imageCounter
                      .replace("{current}", String(imageCount))
                      .replace("{max}", String(mediaLimits.maxImagesPerItem))}
                  </p>
                </div>
                <p className="text-xs text-zinc-500">
                  {labels.galleryHint
                    .replace("{max}", String(mediaLimits.maxImagesPerItem))
                    .replace(
                      "{galleryMax}",
                      String(mediaLimits.maxGalleryImages),
                    )}
                </p>
                {gallery.length > 0 ? (
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {gallery.map((item, index) => (
                      <li
                        key={item.id}
                        className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-white"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt=""
                          className="aspect-[4/3] w-full object-cover"
                        />
                        <div className="flex flex-col gap-1 p-2">
                          <span className="text-[11px] text-zinc-500">
                            {labels.galleryOrder.replace(
                              "{n}",
                              String(index + 1),
                            )}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              className="rounded border border-zinc-200 px-2 py-1 text-xs disabled:opacity-40"
                              disabled={busy || index === 0}
                              onClick={() => {
                                markDirty();
                                setGallery((prev) => {
                                  const next = [...prev];
                                  [next[index - 1], next[index]] = [
                                    next[index]!,
                                    next[index - 1]!,
                                  ];
                                  return next;
                                });
                              }}
                            >
                              {labels.moveUp}
                            </button>
                            <button
                              type="button"
                              className="rounded border border-zinc-200 px-2 py-1 text-xs disabled:opacity-40"
                              disabled={busy || index === gallery.length - 1}
                              onClick={() => {
                                markDirty();
                                setGallery((prev) => {
                                  const next = [...prev];
                                  [next[index + 1], next[index]] = [
                                    next[index]!,
                                    next[index + 1]!,
                                  ];
                                  return next;
                                });
                              }}
                            >
                              {labels.moveDown}
                            </button>
                            <button
                              type="button"
                              className="rounded border border-zinc-200 px-2 py-1 text-xs text-red-700"
                              disabled={busy}
                              onClick={() => {
                                markDirty();
                                setGallery((prev) =>
                                  prev.filter((g) => g.id !== item.id),
                                );
                              }}
                            >
                              {labels.remove}
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {!imagesAtLimit ? (
                  <MediaDropzone
                    id="evt-gallery-image"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    disabled={busy}
                    multiple
                    dropHint={labels.dropHint}
                    hint={labels.mainImageHint.replace(
                      "{maxMb}",
                      String(imageMaxMb),
                    )}
                    error={mediaError}
                    onFiles={async (files) => {
                      if (files.length > remainingImageSlots) {
                        const msg = labels.imagesExceedSelection.replace(
                          "{remaining}",
                          String(remainingImageSlots),
                        );
                        setMediaError(msg);
                        setError(msg);
                        return;
                      }
                      const uploaded: AdminMediaRef[] = [];
                      for (const file of files) {
                        const asset = await uploadFile(file, "event-gallery");
                        if (!asset) {
                          if (uploaded.length > 0) {
                            markDirty();
                            setGallery((prev) => [...prev, ...uploaded]);
                          }
                          return;
                        }
                        uploaded.push(asset);
                      }
                      if (uploaded.length > 0) {
                        markDirty();
                        setGallery((prev) => [...prev, ...uploaded]);
                      }
                    }}
                  />
                ) : (
                  <p className="text-xs text-amber-800" role="status">
                    {labels.imagesAtLimit.replace(
                      "{max}",
                      String(mediaLimits.maxImagesPerItem),
                    )}
                  </p>
                )}
              </div>

              <YouTubeUrlField
                id="event-youtube"
                value={youtubeUrl}
                disabled={busy}
                labels={{
                  youtubeSection: labels.youtubeSection,
                  youtubeOptional: labels.youtubeOptional,
                  youtubeHint: labels.youtubeHint,
                  youtubeUrl: labels.youtubeUrl,
                  youtubePlaceholder: labels.youtubePlaceholder,
                  youtubeInvalid: labels.youtubeInvalid,
                  youtubeRemove: labels.youtubeRemove,
                  youtubeEmpty: labels.youtubeEmpty,
                }}
                onChange={(next) => {
                  markDirty();
                  setYoutubeUrl(next);
                }}
              />
            </section>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
            <section className="admin-panel flex flex-col gap-4 p-4 sm:p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                {labels.sectionShared}
              </h2>

              {mode === "edit" ? (
                <>
                  <FormField id="slug" label={labels.slugReadonly}>
                    <Input
                      id="slug"
                      value={slugPreview}
                      readOnly
                      disabled
                      className="admin-control"
                    />
                  </FormField>
                  <div className="rounded-lg border border-[var(--admin-border)] bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                    <p className="font-medium text-zinc-700">
                      {labels.timestampsReadonly}
                    </p>
                    <p className="mt-1">
                      {labels.createdAt}:{" "}
                      {new Date(initial!.createdAt).toLocaleString(locale)}
                    </p>
                    <p>
                      {labels.updatedAt}:{" "}
                      {new Date(initial!.updatedAt).toLocaleString(locale)}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-xs leading-relaxed text-zinc-500">
                  {labels.slugHint}
                </p>
              )}

              <FormField
                id="eventDate"
                label={labels.eventDate}
                hint={labels.eventDateHint}
                error={fieldErrors.eventDate}
              >
                <Input
                  id="eventDate"
                  type="date"
                  className="admin-control"
                  value={eventDate}
                  disabled={busy}
                  required
                  onChange={(e) => {
                    markDirty();
                    setEventDate(e.target.value);
                  }}
                />
              </FormField>

              <label className="flex items-start gap-2.5 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-[var(--brand-blue)]"
                  checked={featureOnHomepage}
                  disabled={busy || (mode === "edit" && !isPublished)}
                  onChange={(e) => {
                    markDirty();
                    setFeatureOnHomepage(e.target.checked);
                  }}
                />
                <span>
                  <span className="font-medium text-zinc-900">
                    {labels.featureOnHomepage}
                  </span>
                  <span className="mt-1 block text-xs text-zinc-500">
                    {mode === "edit" && !isPublished
                      ? labels.featureDisabledHint
                      : labels.featureHint}
                  </span>
                </span>
              </label>
            </section>

            <div className="hidden lg:block">{publishPanel}</div>
          </aside>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--admin-border)] bg-white/95 p-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-[1440px] flex-wrap gap-2">
            {mode === "create" || !isPublished ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => submit("DRAFT")}
                >
                  {busy ? labels.saving : labels.saveDraft}
                </Button>
                <Button
                  type="button"
                  variant="brand"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => submit("PUBLISHED")}
                >
                  {busy ? labels.saving : labels.publish}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="brand"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => submit("PUBLISHED")}
                >
                  {busy ? labels.saving : labels.saveChanges}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setConfirmUnpublish(true)}
                >
                  {labels.unpublish}
                </Button>
              </>
            )}
          </div>
        </div>
      </form>

      <AdminConfirmDialog
        open={confirmUnpublish}
        title={labels.unpublishConfirmTitle}
        body={labels.unpublishConfirmBody.replace("{title}", displayTitle)}
        confirmLabel={labels.unpublishConfirm}
        cancelLabel={labels.cancel}
        pending={pending}
        onCancel={() => setConfirmUnpublish(false)}
        onConfirm={() => {
          setConfirmUnpublish(false);
          submit("DRAFT");
        }}
      />
    </>
  );
}
