import "server-only";

import { Readable } from "node:stream";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ServiceException,
} from "@aws-sdk/client-s3";

import {
  notFound,
  serviceUnavailable,
} from "@/server/http/errors";
import {
  assertSafeStorageKey,
  buildObjectKey,
  joinPublicObjectUrl,
  sanitizeUploadFilename,
} from "@/server/storage/keys";
import {
  loadR2EnvConfig,
  R2ConfigError,
  type R2EnvConfig,
} from "@/server/storage/r2-env";
import type {
  StorageProvider,
  StoredObject,
  UploadInput,
} from "@/server/storage/types";

const DEFAULT_CACHE_CONTROL = "public, max-age=31536000, immutable";

function requireR2Config(): R2EnvConfig {
  try {
    return loadR2EnvConfig();
  } catch (error) {
    if (error instanceof R2ConfigError) {
      throw serviceUnavailable(error.message);
    }
    throw serviceUnavailable(
      "Cloudflare R2 storage could not be initialized. Check server configuration.",
    );
  }
}

function mapR2Error(error: unknown, action: string): never {
  const err = error as S3ServiceException & {
    Code?: string;
    name?: string;
    message?: string;
  };
  const code = err?.name || err?.Code || "";
  const message = err?.message || "";

  if (
    code === "NoSuchKey" ||
    code === "NotFound" ||
    err?.$metadata?.httpStatusCode === 404
  ) {
    throw notFound("File not found");
  }
  if (
    code === "InvalidAccessKeyId" ||
    code === "SignatureDoesNotMatch" ||
    code === "AccessDenied" ||
    /credential|access key|signature/i.test(message)
  ) {
    throw serviceUnavailable(
      "Cloudflare R2 credentials were rejected. Check server configuration.",
    );
  }
  if (
    code === "NoSuchBucket" ||
    /NoSuchBucket/i.test(code) ||
    /NoSuchBucket/i.test(message)
  ) {
    throw serviceUnavailable(
      "Cloudflare R2 bucket was not found. Check R2_BUCKET_NAME.",
    );
  }

  console.error(`R2 ${action} failed`, {
    code: code || "UNKNOWN",
    status: err?.$metadata?.httpStatusCode,
  });
  throw serviceUnavailable(`Media storage ${action} failed.`);
}

async function bodyToBuffer(body: UploadInput["body"]): Promise<Buffer> {
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

function createS3Client(config: R2EnvConfig): S3Client {
  return new S3Client({
    region: config.region || "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
    // R2 rejects some newer AWS default checksum modes.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

/**
 * Cloudflare R2 adapter via the S3-compatible API.
 * Public URLs use `R2_PUBLIC_BASE_URL` (never the S3 API endpoint).
 */
export class CloudflareR2Storage implements StorageProvider {
  private readonly config: R2EnvConfig;
  private readonly client: S3Client;

  constructor(config: R2EnvConfig = requireR2Config()) {
    this.config = config;
    this.client = createS3Client(config);
  }

  async upload(input: UploadInput): Promise<StoredObject> {
    const folder = (input.folder || "agenda/other").replace(
      /[^a-z0-9/_-]/gi,
      "",
    );
    const safeName = sanitizeUploadFilename(input.filename);
    const storageKey = buildObjectKey({
      folder,
      filename: input.filename,
      mimeType: input.mimeType,
    });
    const buffer = await bodyToBuffer(input.body);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: storageKey,
          Body: buffer,
          ContentType: input.mimeType,
          CacheControl: DEFAULT_CACHE_CONTROL,
          ContentLength: buffer.byteLength,
        }),
      );
    } catch (error) {
      mapR2Error(error, "upload");
    }

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
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        }),
      );
    } catch (error) {
      const err = error as S3ServiceException;
      if (err?.$metadata?.httpStatusCode === 404) return;
      mapR2Error(error, "delete");
    }
  }

  getPublicUrl(storageKey: string): string {
    const key = assertSafeStorageKey(storageKey);
    // New R2 uploads use the `agenda/` prefix and are served from the public base URL.
    // Legacy local keys stay on the access-checked `/api/media` route until migrated
    // (and optionally rewritten) so switching providers does not break existing media.
    if (!key.startsWith("agenda/")) {
      return `/api/media/${key.split("/").map(encodeURIComponent).join("/")}`;
    }
    return joinPublicObjectUrl(this.config.publicBaseUrl, key);
  }

  async exists(storageKey: string): Promise<boolean> {
    const key = assertSafeStorageKey(storageKey);
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        }),
      );
      return true;
    } catch (error) {
      const err = error as S3ServiceException;
      if (
        err?.name === "NotFound" ||
        err?.name === "NoSuchKey" ||
        err?.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      mapR2Error(error, "head");
    }
  }

  async head(storageKey: string): Promise<{
    sizeBytes: number;
    mimeType?: string;
  }> {
    const key = assertSafeStorageKey(storageKey);
    try {
      const result = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        }),
      );
      return {
        sizeBytes: result.ContentLength ?? 0,
        mimeType: result.ContentType,
      };
    } catch (error) {
      mapR2Error(error, "head");
    }
  }

  async openRead(storageKey: string): Promise<{
    stream: ReadableStream;
    sizeBytes: number;
  }> {
    const key = assertSafeStorageKey(storageKey);
    try {
      const result = await this.client.send(
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        }),
      );
      if (!result.Body) throw notFound("File not found");

      const body = result.Body;
      let webStream: ReadableStream;
      if (body instanceof Readable) {
        webStream = Readable.toWeb(body) as ReadableStream;
      } else if (
        typeof body === "object" &&
        body !== null &&
        "transformToWebStream" in body &&
        typeof (body as { transformToWebStream: () => ReadableStream })
          .transformToWebStream === "function"
      ) {
        webStream = (
          body as { transformToWebStream: () => ReadableStream }
        ).transformToWebStream();
      } else {
        const bytes = await body.transformToByteArray();
        webStream = Readable.toWeb(
          Readable.from(Buffer.from(bytes)),
        ) as ReadableStream;
      }

      return {
        stream: webStream,
        sizeBytes: result.ContentLength ?? 0,
      };
    } catch (error) {
      if (error instanceof Error && "status" in error) throw error;
      mapR2Error(error, "read");
    }
  }
}

export { createS3Client };
