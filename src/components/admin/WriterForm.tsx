"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { z } from "zod";

import { MediaDropzone } from "@/components/admin/MediaDropzone";
import type { MarkdownEditorLabels } from "@/components/admin/markdown/labels";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { adminJson, type ApiErrorPayload } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { sitePath } from "@/i18n/pathnames";
import type { AdminWriterDetail } from "@/types/writer";
import {
  WRITER_SOCIAL_PLATFORMS,
  type WriterSocialLink,
  type WriterSocialPlatform,
} from "@/types/writer";
import type { AdminMediaRef } from "@/types/publication";

const MarkdownEditor = dynamic(
  () =>
    import("@/components/admin/MarkdownEditor").then((m) => m.MarkdownEditor),
  { ssr: false },
);

const emailFormatSchema = z.string().trim().email();

function formatApiValidationMessage(
  payload: ApiErrorPayload,
  fallback: string,
): string {
  const details = payload.error?.details;
  if (Array.isArray(details) && details.length > 0) {
    const parts = details
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const row = item as { path?: unknown; message?: unknown };
        if (typeof row.message !== "string" || !row.message) return null;
        const path =
          typeof row.path === "string" && row.path ? `${row.path}: ` : "";
        return `${path}${row.message}`;
      })
      .filter((part): part is string => Boolean(part));
    if (parts.length > 0) return parts.join(" ");
  }
  return payload.error?.message || fallback;
}

type Labels = Dictionary["admin"]["writer"];

type Props = {
  mode: "create" | "edit";
  labels: Labels;
  markdownLabels: MarkdownEditorLabels;
  locale: Locale;
  initial?: AdminWriterDetail | null;
  mediaLimits: { maxImageBytes: number };
};

type TranslationState = {
  fullName: string;
  major: string;
  biography: string;
};

type SocialRow = {
  platform: WriterSocialPlatform;
  url: string;
};

type FieldErrors = { ar: boolean; en: boolean; email: boolean; image: boolean };

function emptyTranslation(): TranslationState {
  return { fullName: "", major: "", biography: "" };
}

function translationFrom(
  initial: AdminWriterDetail | null | undefined,
  locale: "ar" | "en",
): TranslationState {
  const t = initial?.translations.find((x) => x.locale === locale);
  return t
    ? {
        fullName: t.fullName,
        major: t.major,
        biography: t.biography ?? "",
      }
    : emptyTranslation();
}

function platformLabel(
  platform: WriterSocialPlatform,
  labels: Labels,
): string {
  return labels.socialPlatforms[platform];
}

function normalizeSocialLinks(links: WriterSocialLink[]): SocialRow[] {
  return links.map((l) => ({ platform: l.platform, url: l.url }));
}

function socialLinksForSubmit(rows: SocialRow[]): WriterSocialLink[] {
  return rows
    .map((r) => ({ platform: r.platform, url: r.url.trim() }))
    .filter((r) => r.url && /^https?:\/\//i.test(r.url));
}

export function WriterForm({
  mode,
  labels,
  markdownLabels,
  locale,
  initial,
  mediaLimits,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [contentLocale, setContentLocale] = useState<"ar" | "en">("ar");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    ar: false,
    en: false,
    email: false,
    image: false,
  });
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const nameArRef = useRef<HTMLInputElement>(null);
  const nameEnRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState(initial?.email ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [profileImage, setProfileImage] = useState<AdminMediaRef | null>(
    initial?.profileImage ?? null,
  );
  const [ar, setAr] = useState(() => translationFrom(initial, "ar"));
  const [en, setEn] = useState(() => translationFrom(initial, "en"));
  const [socialRows, setSocialRows] = useState<SocialRow[]>(() =>
    initial?.socialLinks?.length
      ? normalizeSocialLinks(initial.socialLinks)
      : [],
  );

  const imageMaxMb = Math.round(mediaLimits.maxImageBytes / (1024 * 1024));
  const busy = pending || uploading;
  const active = contentLocale === "ar" ? ar : en;
  const setActive = contentLocale === "ar" ? setAr : setEn;

  const publicPath = slug ? sitePath(`/writers/${slug}`, locale) : null;
  const publicUrl =
    typeof window !== "undefined" && publicPath
      ? `${window.location.origin}${publicPath}`
      : publicPath;

  const usedPlatforms = useMemo(
    () => new Set(socialRows.map((r) => r.platform)),
    [socialRows],
  );
  const availablePlatforms = useMemo(
    () => WRITER_SOCIAL_PLATFORMS.filter((p) => !usedPlatforms.has(p)),
    [usedPlatforms],
  );

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = labels.unsavedWarning;
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, labels.unsavedWarning]);

  const bodyPayload = useMemo(
    () => ({
      email: email.trim() ? email.trim() : null,
      profileImageId: profileImage?.id ?? null,
      socialLinks: socialLinksForSubmit(socialRows),
      translations: [
        { locale: "ar" as const, ...ar },
        { locale: "en" as const, ...en },
      ],
    }),
    [email, profileImage, ar, en, socialRows],
  );

  function markDirty() {
    setDirty(true);
    setMessage(null);
    setError(null);
    setFieldErrors({ ar: false, en: false, email: false, image: false });
  }

  function validate(): boolean {
    const arOk = Boolean(ar.fullName.trim()) && Boolean(ar.biography.trim());
    const enOk = Boolean(en.fullName.trim()) && Boolean(en.biography.trim());
    const trimmedEmail = email.trim();
    const emailOk =
      trimmedEmail.length === 0 || emailFormatSchema.safeParse(trimmedEmail).success;
    const imageOk = Boolean(profileImage?.id);
    const next: FieldErrors = {
      ar: !arOk,
      en: !enOk,
      email: !emailOk,
      image: !imageOk,
    };
    setFieldErrors(next);

    if (!arOk || !enOk || !emailOk || !imageOk) {
      setError(
        !imageOk
          ? labels.errorImageRequired
          : !emailOk
            ? labels.errorInvalidEmail
            : labels.errorValidation,
      );
      if (!arOk) {
        setContentLocale("ar");
        requestAnimationFrame(() => nameArRef.current?.focus());
      } else if (!enOk) {
        setContentLocale("en");
        requestAnimationFrame(() => nameEnRef.current?.focus());
      } else if (!emailOk) {
        requestAnimationFrame(() => emailRef.current?.focus());
      }
      return false;
    }
    return true;
  }

  async function uploadImage(file: File): Promise<AdminMediaRef | null> {
    const previous = profileImage;
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("purpose", "writer-profile");
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
        setError(data?.error?.message || labels.errorGeneric);
        setProfileImage(previous);
        return null;
      }
      return data.media;
    } catch {
      setError(labels.errorGeneric);
      setProfileImage(previous);
      return null;
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    if (busy) return;
    if (!validate()) return;
    setError(null);
    startTransition(async () => {
      const payload = {
        ...bodyPayload,
        profileImageId: profileImage!.id,
      };
      const result =
        mode === "create"
          ? await adminJson<{ writer: AdminWriterDetail }>(
              "/api/admin/writers",
              { method: "POST", body: JSON.stringify(payload) },
            )
          : await adminJson<{ writer: AdminWriterDetail }>(
              `/api/admin/writers/${initial!.id}`,
              { method: "PATCH", body: JSON.stringify(payload) },
            );

      if (!result.ok) {
        if (result.status === 409) setError(labels.errorConflict);
        else if (result.status === 400) {
          setError(
            formatApiValidationMessage(result.payload, labels.errorValidation),
          );
        } else setError(labels.errorGeneric);
        return;
      }

      setDirty(false);
      setMessage(
        mode === "create" ? labels.successCreated : labels.successSaved,
      );
      if (mode === "create") {
        router.push(`/admin/writers/${result.data.writer.id}/edit`);
        router.refresh();
      } else {
        setSlug(result.data.writer.slug);
        setSocialRows(normalizeSocialLinks(result.data.writer.socialLinks));
        router.refresh();
      }
    });
  }

  async function copyPublicLink() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopyFeedback(labels.copyLinkSuccess);
    } catch {
      setCopyFeedback(labels.copyLinkFailed);
    }
    window.setTimeout(() => setCopyFeedback(null), 2500);
  }

  function addSocialRow() {
    const next = availablePlatforms[0];
    if (!next) return;
    markDirty();
    setSocialRows((prev) => [...prev, { platform: next, url: "" }]);
  }

  function removeSocialRow(index: number) {
    markDirty();
    setSocialRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSocialPlatform(index: number, platform: WriterSocialPlatform) {
    if (usedPlatforms.has(platform) && socialRows[index]?.platform !== platform) {
      return;
    }
    markDirty();
    setSocialRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, platform } : row)),
    );
  }

  function updateSocialUrl(index: number, url: string) {
    markDirty();
    setSocialRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, url } : row)),
    );
  }

  const actionsPanel = (
    <div className="admin-panel flex flex-col gap-3 p-4 sm:p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {labels.sectionActions}
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
        <Button
          type="button"
          variant="brand"
          disabled={busy}
          onClick={submit}
        >
          {busy
            ? labels.saving
            : mode === "create"
              ? labels.createWriter
              : labels.saveChanges}
        </Button>
        <Link
          href="/admin/writers"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-300 bg-white px-3.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          onClick={(e) => {
            if (dirty && !window.confirm(labels.unsavedWarning)) {
              e.preventDefault();
            }
          }}
        >
          {labels.cancel}
        </Link>
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
                href="/admin/writers"
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
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              {mode === "create" ? labels.newTitle : labels.editTitle}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[var(--admin-muted)]">
              {labels.uiLanguageNote}
            </p>
            {mode === "edit" && (ar.fullName || en.fullName) ? (
              <p className="mt-1 truncate text-sm font-medium text-zinc-700">
                {locale === "ar"
                  ? ar.fullName || en.fullName
                  : en.fullName || ar.fullName}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {mode === "edit" && slug ? (
              <a
                href={publicPath!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[var(--brand-blue)] hover:underline"
              >
                {labels.viewPublic}
              </a>
            ) : null}
            <Link
              href="/admin/writers"
              className="text-sm font-medium text-[var(--brand-blue)] hover:underline"
            >
              {labels.backToList}
            </Link>
          </div>
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
                  id={`name-${contentLocale}`}
                  label={labels.fullName}
                  required
                  error={
                    fieldErrors[contentLocale] && !active.fullName.trim()
                      ? labels.errorValidation
                      : undefined
                  }
                >
                  <Input
                    ref={contentLocale === "ar" ? nameArRef : nameEnRef}
                    id={`name-${contentLocale}`}
                    dir={contentLocale === "ar" ? "rtl" : "ltr"}
                    className="admin-control"
                    value={active.fullName}
                    disabled={busy}
                    onChange={(e) => {
                      markDirty();
                      setActive((s) => ({ ...s, fullName: e.target.value }));
                    }}
                  />
                </FormField>
                <FormField
                  id={`major-${contentLocale}`}
                  label={labels.major}
                  optional
                  optionalLabel={labels.optional}
                >
                  <Input
                    id={`major-${contentLocale}`}
                    dir={contentLocale === "ar" ? "rtl" : "ltr"}
                    className="admin-control"
                    value={active.major}
                    disabled={busy}
                    onChange={(e) => {
                      markDirty();
                      setActive((s) => ({ ...s, major: e.target.value }));
                    }}
                  />
                </FormField>
                <FormField
                  id={`bio-${contentLocale}`}
                  label={labels.biography}
                  required
                  error={
                    fieldErrors[contentLocale] && !active.biography.trim()
                      ? labels.errorValidation
                      : undefined
                  }
                >
                  <p className="mb-2 text-sm text-[var(--admin-muted)]">
                    {labels.biographyHint}
                  </p>
                  <MarkdownEditor
                    id={`bio-${contentLocale}`}
                    dir={contentLocale === "ar" ? "rtl" : "ltr"}
                    value={active.biography}
                    disabled={busy}
                    labels={markdownLabels}
                    alignStartPreview
                    onChange={(value) => {
                      markDirty();
                      setActive((s) => ({ ...s, biography: value }));
                    }}
                  />
                </FormField>
              </div>
            </section>

            <section className="admin-panel flex flex-col gap-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-zinc-900">
                  {labels.sectionSocial}
                </h2>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-9"
                  disabled={busy || availablePlatforms.length === 0}
                  onClick={addSocialRow}
                >
                  {labels.addSocialLink}
                </Button>
              </div>
              <p className="text-sm text-[var(--admin-muted)]">
                {labels.socialHint}
              </p>
              {socialRows.length === 0 ? (
                <p className="text-sm text-zinc-500">{labels.socialEmpty}</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {socialRows.map((row, index) => (
                    <li
                      key={`${row.platform}-${index}`}
                      className="flex flex-col gap-2 rounded-lg border border-[var(--admin-border)] p-3 sm:flex-row sm:items-end"
                    >
                      <div className="min-w-0 flex-1">
                        <label
                          className="mb-1 block text-xs font-medium text-zinc-600"
                          htmlFor={`social-platform-${index}`}
                        >
                          {labels.socialPlatform}
                        </label>
                        <select
                          id={`social-platform-${index}`}
                          className="admin-control w-full"
                          value={row.platform}
                          disabled={busy}
                          onChange={(e) =>
                            updateSocialPlatform(
                              index,
                              e.target.value as WriterSocialPlatform,
                            )
                          }
                        >
                          <option value={row.platform}>
                            {platformLabel(row.platform, labels)}
                          </option>
                          {WRITER_SOCIAL_PLATFORMS.filter(
                            (p) =>
                              p === row.platform || !usedPlatforms.has(p),
                          ).map((p) =>
                            p === row.platform ? null : (
                              <option key={p} value={p}>
                                {platformLabel(p, labels)}
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                      <div className="min-w-0 flex-[2]">
                        <label
                          className="mb-1 block text-xs font-medium text-zinc-600"
                          htmlFor={`social-url-${index}`}
                        >
                          {labels.socialUrl}
                        </label>
                        <Input
                          id={`social-url-${index}`}
                          type="url"
                          dir="ltr"
                          className="admin-control"
                          placeholder={labels.socialUrlPlaceholder}
                          value={row.url}
                          disabled={busy}
                          onChange={(e) =>
                            updateSocialUrl(index, e.target.value)
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-10 shrink-0"
                        disabled={busy}
                        onClick={() => removeSocialRow(index)}
                      >
                        {labels.removeSocialLink}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="flex flex-col gap-6 lg:sticky lg:top-24">
            <section className="admin-panel flex flex-col gap-4 p-4 sm:p-5">
              <h2 className="text-base font-semibold text-zinc-900">
                {labels.sectionPortrait}
              </h2>
              {profileImage ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-36 w-36 overflow-hidden rounded-full bg-zinc-100 ring-4 ring-[var(--admin-accent-soft)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={profileImage.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-9"
                    disabled={busy}
                    onClick={() =>
                      document.getElementById("writer-portrait-replace")?.click()
                    }
                  >
                    {labels.replace}
                  </Button>
                  <input
                    id="writer-portrait-replace"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={busy}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      const asset = await uploadImage(file);
                      if (asset) {
                        markDirty();
                        setProfileImage(asset);
                      }
                    }}
                  />
                </div>
              ) : (
                <MediaDropzone
                  id="writer-portrait"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={busy}
                  dropHint={labels.dropHint}
                  hint={labels.profileImageHint.replace(
                    "{maxMb}",
                    String(imageMaxMb),
                  )}
                  error={
                    fieldErrors.image ? labels.errorImageRequired : null
                  }
                  onFile={async (file) => {
                    const asset = await uploadImage(file);
                    if (asset) {
                      markDirty();
                      setProfileImage(asset);
                    }
                  }}
                >
                  <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-200/80 text-xs font-medium text-zinc-500">
                    {labels.missingPortrait}
                  </div>
                </MediaDropzone>
              )}
              {profileImage ? (
                <p className="text-center text-xs text-[var(--admin-muted)]">
                  {labels.profileImageHint.replace(
                    "{maxMb}",
                    String(imageMaxMb),
                  )}
                </p>
              ) : null}
            </section>

            <section className="admin-panel flex flex-col gap-4 p-4 sm:p-5">
              <h2 className="text-base font-semibold text-zinc-900">
                {labels.sectionContact}
              </h2>
              <FormField
                id="email"
                label={labels.email}
                optional
                optionalLabel={labels.optional}
                error={
                  fieldErrors.email ? labels.errorInvalidEmail : undefined
                }
              >
                <Input
                  ref={emailRef}
                  id="email"
                  type="email"
                  dir="ltr"
                  className="admin-control"
                  value={email}
                  disabled={busy}
                  onChange={(e) => {
                    markDirty();
                    setEmail(e.target.value);
                  }}
                />
              </FormField>
            </section>

            <section className="admin-panel flex flex-col gap-3 p-4 sm:p-5">
              <h2 className="text-base font-semibold text-zinc-900">
                {labels.sectionDetails}
              </h2>
              {mode === "create" ? (
                <p className="text-sm text-[var(--admin-muted)]">
                  {labels.slugHintCreate}
                </p>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-medium text-zinc-500">
                      {labels.slugReadonly}
                    </p>
                    <p
                      className="mt-1 break-all font-mono text-sm text-zinc-800"
                      dir="ltr"
                    >
                      {slug}
                    </p>
                    <p className="mt-1 text-xs text-[var(--admin-muted)]">
                      {labels.slugStableHint}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500">
                      {labels.publicLink}
                    </p>
                    <p
                      className="mt-1 break-all text-sm text-[var(--brand-blue)]"
                      dir="ltr"
                    >
                      {publicPath}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-9"
                        onClick={() => void copyPublicLink()}
                      >
                        {labels.copyLink}
                      </Button>
                      <a
                        href={publicPath!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-9 items-center rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                      >
                        {labels.viewPublic}
                      </a>
                    </div>
                    {copyFeedback ? (
                      <p className="mt-1 text-xs text-emerald-800" role="status">
                        {copyFeedback}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-sm text-[var(--admin-muted)]">
                    <p>
                      {labels.createdAt}:{" "}
                      {new Date(initial!.createdAt).toLocaleString(locale)}
                    </p>
                    <p>
                      {labels.updatedAt}:{" "}
                      {new Date(initial!.updatedAt).toLocaleString(locale)}
                    </p>
                  </div>
                </>
              )}
            </section>

            <div className="hidden lg:block">{actionsPanel}</div>
          </aside>
        </div>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--admin-border)] bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg flex-col gap-2">
          {dirty ? (
            <p className="text-center text-xs font-medium text-amber-800">
              {labels.unsavedIndicator}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Link
              href="/admin/writers"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium"
              onClick={(e) => {
                if (dirty && !window.confirm(labels.unsavedWarning)) {
                  e.preventDefault();
                }
              }}
            >
              {labels.cancel}
            </Link>
            <Button
              type="button"
              variant="brand"
              className="flex-1"
              disabled={busy}
              onClick={submit}
            >
              {busy
                ? labels.saving
                : mode === "create"
                  ? labels.createWriter
                  : labels.saveChanges}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}