import "server-only";

import { notImplemented, serviceUnavailable } from "@/server/http/errors";
import { LocalFilesystemStorage } from "@/server/storage/local";
import { CloudflareR2Storage } from "@/server/storage/r2";
import type {
  StorageProvider,
  StoredObject,
  UploadInput,
} from "@/server/storage/types";

/**
 * Placeholder storage provider. Throws 501 until a vendor adapter is wired.
 */
class UnimplementedStorage implements StorageProvider {
  async upload(input: UploadInput): Promise<StoredObject> {
    void input;
    throw notImplemented("Media storage upload");
  }

  async delete(storageKey: string): Promise<void> {
    void storageKey;
    throw notImplemented("Media storage delete");
  }

  getPublicUrl(storageKey: string): string {
    return `/api/media/${storageKey
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
  }
}

function createDefaultProvider(): StorageProvider {
  const mode = (process.env.STORAGE_PROVIDER || "local").trim().toLowerCase();
  if (mode === "unimplemented" || mode === "none") {
    return new UnimplementedStorage();
  }
  if (mode === "r2" || mode === "cloudflare-r2" || mode === "cloudflare") {
    try {
      return new CloudflareR2Storage();
    } catch (error) {
      // Fail closed in production-style r2 mode — never silently use local disk.
      if (error instanceof Error && "status" in error) throw error;
      throw serviceUnavailable(
        "Cloudflare R2 storage could not be initialized. Check server configuration.",
      );
    }
  }
  // Default: local filesystem for development
  return new LocalFilesystemStorage();
}

let provider: StorageProvider = createDefaultProvider();

export function getStorage(): StorageProvider {
  return provider;
}

/** Test/later-phase hook to swap the adapter without rewriting call sites. */
export function setStorageProvider(next: StorageProvider): void {
  provider = next;
}

export function getLocalStorage(): LocalFilesystemStorage | null {
  return provider instanceof LocalFilesystemStorage ? provider : null;
}

export function getR2Storage(): CloudflareR2Storage | null {
  return provider instanceof CloudflareR2Storage ? provider : null;
}

export type { StorageProvider, StoredObject, UploadInput };
export { MEDIA_LIMITS, ALLOWED_IMAGE_MIME, ALLOWED_PDF_MIME } from "@/server/storage/limits";
export {
  assertContentImageCountAllowed,
  countContentImages,
} from "@/server/storage/content-image-limits";
export {
  folderForMediaPurpose,
  assertSafeStorageKey,
  joinPublicObjectUrl,
} from "@/server/storage/keys";
