import { NextResponse } from "next/server";

import { getAdminSession } from "@/server/auth";
import { AppError, notFound } from "@/server/http/errors";
import { jsonError } from "@/server/http/responses";
import { assertMediaAccess } from "@/server/services/media";
import { getLocalStorage, getStorage } from "@/server/storage";

type RouteContext = { params: Promise<{ key: string[] }> };

/**
 * Controlled media delivery.
 * - Authenticated admins may preview any stored asset (including drafts).
 * - Anonymous users only receive assets referenced by published content.
 * - Supports local disk and Cloudflare R2 via the active StorageProvider.
 * - Falls back to local disk when R2 is active so unmigrated files remain readable.
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { key: parts } = await context.params;
    const storageKey = parts.map(decodeURIComponent).join("/");
    if (!storageKey || storageKey.includes("..")) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid media path." } },
        { status: 400 },
      );
    }

    const session = await getAdminSession();
    const isAdmin = session.authenticated;
    const meta = await assertMediaAccess(storageKey, isAdmin);

    const opened = await openMediaStream(storageKey);
    if (!opened) {
      throw notFound("File not found");
    }

    const forceDownload =
      new URL(request.url).searchParams.get("download") === "1";
    const safeName = meta.filename.replace(/"/g, "");
    const headers = new Headers({
      "Content-Type": meta.mimeType,
      "Content-Length": String(opened.sizeBytes),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": isAdmin
        ? "private, no-store"
        : "public, max-age=3600, stale-while-revalidate=86400",
      "Content-Disposition": `${forceDownload ? "attachment" : "inline"}; filename="${safeName}"`,
    });

    return new NextResponse(opened.stream, { status: 200, headers });
  } catch (error) {
    if (error instanceof AppError) {
      return jsonError(error);
    }
    console.error(error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred.",
        },
      },
      { status: 500 },
    );
  }
}

async function openMediaStream(storageKey: string): Promise<{
  stream: ReadableStream;
  sizeBytes: number;
} | null> {
  const storage = getStorage();
  if (storage.openRead) {
    try {
      return await storage.openRead(storageKey);
    } catch (error) {
      if (!(error instanceof AppError) || error.status !== 404) {
        throw error;
      }
    }
  }

  const local = getLocalStorage();
  if (local) {
    try {
      return await local.openRead(storageKey);
    } catch (error) {
      if (!(error instanceof AppError) || error.status !== 404) {
        throw error;
      }
      return null;
    }
  }

  // R2 mode: serve leftover local files that have not been migrated yet.
  try {
    const { LocalFilesystemStorage } = await import("@/server/storage/local");
    const fallback = new LocalFilesystemStorage();
    if (await fallback.exists(storageKey)) {
      return fallback.openRead(storageKey);
    }
  } catch (error) {
    if (!(error instanceof AppError) || error.status !== 404) {
      throw error;
    }
  }

  return null;
}
