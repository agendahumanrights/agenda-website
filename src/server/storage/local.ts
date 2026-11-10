import "server-only";

import { createReadStream } from "node:fs";
import { mkdir, unlink, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { notFound } from "@/server/http/errors";
import {
  assertSafeStorageKey,
  buildObjectKey,
  sanitizeUploadFilename,
} from "@/server/storage/keys";
import type {
  StorageProvider,
  StoredObject,
  UploadInput,
} from "@/server/storage/types";

function resolveUploadRoot(): string {
  const configured = process.env.UPLOAD_DIR?.trim();
  return path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    configured || "uploads",
  );
}

async function bodyToBuffer(
  body: UploadInput["body"],
): Promise<Buffer> {
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}

/**
 * Local filesystem adapter for development.
 * Not production-ready on ephemeral serverless disks — use Cloudflare R2.
 */
export class LocalFilesystemStorage implements StorageProvider {
  readonly root = resolveUploadRoot();

  async upload(input: UploadInput): Promise<StoredObject> {
    const folder = (input.folder || "misc").replace(/[^a-z0-9/_-]/gi, "");
    const safeName = sanitizeUploadFilename(input.filename);
    const storageKey = buildObjectKey({
      folder,
      filename: input.filename,
      mimeType: input.mimeType,
    });
    const absolute = path.join(this.root, storageKey);
    await mkdir(path.dirname(absolute), { recursive: true });
    const buffer = await bodyToBuffer(input.body);
    await writeFile(absolute, buffer);

    return {
      storageKey,
      filename: safeName,
      mimeType: input.mimeType,
      sizeBytes: buffer.byteLength,
      url: this.getPublicUrl(storageKey),
    };
  }

  async delete(storageKey: string): Promise<void> {
    const key = assertSafeStorageKey(storageKey);
    const absolute = path.join(this.root, key);
    try {
      await unlink(absolute);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") throw error;
    }
  }

  getPublicUrl(storageKey: string): string {
    const key = assertSafeStorageKey(storageKey);
    return `/api/media/${key.split("/").map(encodeURIComponent).join("/")}`;
  }

  absolutePath(storageKey: string): string {
    return path.join(this.root, assertSafeStorageKey(storageKey));
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      await access(this.absolutePath(storageKey));
      return true;
    } catch {
      return false;
    }
  }

  async openRead(storageKey: string): Promise<{
    stream: ReadableStream;
    sizeBytes: number;
  }> {
    const absolute = this.absolutePath(storageKey);
    try {
      await access(absolute);
    } catch {
      throw notFound("File not found");
    }
    const { size } = await import("node:fs/promises").then((fs) =>
      fs.stat(absolute),
    );
    const nodeStream = createReadStream(absolute);
    return {
      stream: Readable.toWeb(nodeStream) as ReadableStream,
      sizeBytes: size,
    };
  }
}
