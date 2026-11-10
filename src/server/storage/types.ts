/**
 * Vendor-agnostic storage interface.
 * Adapters: local filesystem (`STORAGE_PROVIDER=local`) and Cloudflare R2 (`r2`).
 */

export type StoredObject = {
  storageKey: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
};

export type UploadInput = {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  body: ReadableStream | Buffer | Uint8Array;
  /** Optional folder prefix, e.g. "agenda/publications/main" */
  folder?: string;
};

export type StoredObjectMeta = {
  sizeBytes: number;
  mimeType?: string;
};

export interface StorageProvider {
  upload(input: UploadInput): Promise<StoredObject>;
  delete(storageKey: string): Promise<void>;
  getPublicUrl(storageKey: string): string;
  /** Optional: verify the object exists before attaching to content. */
  exists?(storageKey: string): Promise<boolean>;
  /** Optional: object metadata (HEAD). */
  head?(storageKey: string): Promise<StoredObjectMeta>;
  /** Optional: stream bytes for access-checked delivery (`/api/media`). */
  openRead?(storageKey: string): Promise<{
    stream: ReadableStream;
    sizeBytes: number;
  }>;
}
