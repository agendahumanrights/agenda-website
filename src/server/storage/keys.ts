import path from "node:path";
import { randomUUID } from "node:crypto";

import { badRequest } from "@/server/http/errors";
import type { MediaPurpose } from "@/server/validations/media";

/** Normalize and reject path traversal / absolute keys. */
export function assertSafeStorageKey(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");
  if (
    !normalized ||
    normalized.includes("..") ||
    path.isAbsolute(normalized) ||
    normalized.startsWith("/")
  ) {
    throw badRequest("Invalid storage key.");
  }
  return normalized;
}

/** Sanitize a user-supplied filename; never use it alone as an object key. */
export function sanitizeUploadFilename(filename: string): string {
  const base = path.basename(filename).replace(/[^\w.\-()+ ]+/g, "_");
  return base.slice(0, 120) || "file";
}

function extensionFor(filename: string, mimeType: string): string {
  const fromName = path.extname(sanitizeUploadFilename(filename)).toLowerCase();
  if (fromName && fromName.length <= 8) return fromName;
  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "application/pdf":
      return ".pdf";
    default:
      return "";
  }
}

/**
 * Map upload purpose → object-key folder (no trailing slash).
 * Entity IDs are unavailable at upload time (orphan-then-attach), so folders
 * are purpose-based under the `agenda/` prefix.
 */
export function folderForMediaPurpose(purpose: MediaPurpose): string {
  switch (purpose) {
    case "publication-main":
      return "agenda/publications/main";
    case "publication-gallery":
      return "agenda/publications/gallery";
    case "publication-pdf":
      return "agenda/publications/documents";
    case "event-main":
      return "agenda/events/main";
    case "event-gallery":
      return "agenda/events/gallery";
    case "founder-profile":
      return "agenda/founders/profile";
    default: {
      const _exhaustive: never = purpose;
      return _exhaustive;
    }
  }
}

/** Build a collision-resistant object key under a folder prefix. */
export function buildObjectKey(input: {
  folder: string;
  filename: string;
  mimeType: string;
}): string {
  const folder = input.folder.replace(/[^a-z0-9/_-]/gi, "").replace(/^\/+|\/+$/g, "");
  const safeName = sanitizeUploadFilename(input.filename);
  const ext = extensionFor(safeName, input.mimeType);
  const stem = safeName.replace(/\.[^.]+$/, "").slice(0, 80) || "file";
  const unique = `${randomUUID()}-${stem}${ext}`;
  return assertSafeStorageKey(folder ? `${folder}/${unique}` : unique);
}

/** Join a public base URL with an object key (no double slashes). */
export function joinPublicObjectUrl(baseUrl: string, storageKey: string): string {
  const key = assertSafeStorageKey(storageKey);
  const base = baseUrl.replace(/\/+$/, "");
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  return `${base}/${encoded}`;
}
