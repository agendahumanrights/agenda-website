/**
 * Migrate local MediaAsset files to Cloudflare R2.
 *
 * Default mode is dry-run (no uploads, no DB writes, no local deletes).
 *
 * Usage:
 *   npx tsx scripts/migrate-media-to-r2.ts
 *   npx tsx scripts/migrate-media-to-r2.ts --execute
 *   npx tsx scripts/migrate-media-to-r2.ts --execute --rewrite-keys
 *
 * Flags:
 *   --execute       Perform uploads (and optional key rewrites). Without this, dry-run only.
 *   --rewrite-keys  After a verified upload, rewrite storageKey to agenda/... and update DB
 *                   so public CDN URLs are used. Preserves gallery order (FK by media id).
 *   --limit=N       Process at most N assets (useful for smoke tests).
 *
 * Safety:
 *   - Never deletes local files.
 *   - Skips objects already present in R2 with matching size (idempotent).
 *   - Does not update DB until the R2 object is verified via HEAD.
 *   - Does not print credentials.
 */

import "dotenv/config";

import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";
import { loadR2EnvConfig } from "../src/server/storage/r2-env";

type ReportRow = {
  id: string;
  storageKey: string;
  status:
    | "would-upload"
    | "uploaded"
    | "skipped-already-on-r2"
    | "missing-local"
    | "failed"
    | "rewritten";
  detail?: string;
  newKey?: string;
};

function parseArgs(argv: string[]) {
  const execute = argv.includes("--execute");
  const rewriteKeys = argv.includes("--rewrite-keys");
  const limitArg = argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg
    ? Number.parseInt(limitArg.slice("--limit=".length), 10)
    : undefined;
  return {
    execute,
    rewriteKeys,
    limit: Number.isFinite(limit) && (limit as number) > 0 ? limit : undefined,
  };
}

function resolveUploadRoot(): string {
  const configured = process.env.UPLOAD_DIR?.trim();
  return path.resolve(process.cwd(), configured || "uploads");
}

function assertSafeKey(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..") || path.isAbsolute(normalized)) {
    throw new Error(`Unsafe storage key: ${storageKey}`);
  }
  return normalized;
}

function mapLegacyKeyToAgenda(storageKey: string, mimeType: string): string {
  const key = assertSafeKey(storageKey);
  if (key.startsWith("agenda/")) return key;

  const lower = key.toLowerCase();
  let folder = "agenda/other";
  if (lower.includes("publication") && (lower.includes("pdf") || mimeType === "application/pdf")) {
    folder = "agenda/publications/documents";
  } else if (lower.includes("publication") && lower.includes("gallery")) {
    folder = "agenda/publications/gallery";
  } else if (lower.includes("publication")) {
    folder = "agenda/publications/main";
  } else if (lower.includes("event") && lower.includes("gallery")) {
    folder = "agenda/events/gallery";
  } else if (lower.includes("event")) {
    folder = "agenda/events/main";
  } else if (lower.includes("founder")) {
    folder = "agenda/founders/profile";
  }

  const base = path.basename(key);
  return `${folder}/${randomUUID()}-${base}`.replace(/\\/g, "/");
}

async function fileExists(absolute: string): Promise<boolean> {
  try {
    await access(absolute);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const { execute, rewriteKeys, limit } = parseArgs(process.argv.slice(2));
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  let r2;
  try {
    r2 = loadR2EnvConfig();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const client = new S3Client({
    region: r2.region || "auto",
    endpoint: r2.endpoint,
    credentials: {
      accessKeyId: r2.accessKeyId,
      secretAccessKey: r2.secretAccessKey,
    },
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  const uploadRoot = resolveUploadRoot();
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });
  const report: ReportRow[] = [];

  console.log(
    JSON.stringify(
      {
        mode: execute ? "execute" : "dry-run",
        rewriteKeys,
        bucket: r2.bucket,
        uploadRoot,
        limit: limit ?? null,
        publicBaseHost: new URL(r2.publicBaseUrl).host,
      },
      null,
      2,
    ),
  );

  try {
    const assets = await prisma.mediaAsset.findMany({
      orderBy: { createdAt: "asc" },
      ...(limit ? { take: limit } : {}),
    });

    for (const asset of assets) {
      const storageKey = assertSafeKey(asset.storageKey);
      const absolute = path.join(uploadRoot, storageKey);

      const targetKey = rewriteKeys
        ? mapLegacyKeyToAgenda(storageKey, asset.mimeType)
        : storageKey;

      try {
        const head = await client.send(
          new HeadObjectCommand({ Bucket: r2.bucket, Key: targetKey }),
        );
        const remoteSize = head.ContentLength ?? -1;
        if (remoteSize === asset.sizeBytes) {
          if (
            execute &&
            rewriteKeys &&
            targetKey !== storageKey
          ) {
            await prisma.mediaAsset.update({
              where: { id: asset.id },
              data: { storageKey: targetKey },
            });
            report.push({
              id: asset.id,
              storageKey,
              status: "rewritten",
              newKey: targetKey,
              detail: "Already on R2; DB key updated",
            });
          } else {
            report.push({
              id: asset.id,
              storageKey,
              status: "skipped-already-on-r2",
              newKey: targetKey !== storageKey ? targetKey : undefined,
            });
          }
          continue;
        }
      } catch {
        // Not on R2 yet (or HEAD failed) — continue to local check/upload.
      }

      if (!(await fileExists(absolute))) {
        // Maybe already only on R2 under the original key.
        try {
          const headOrig = await client.send(
            new HeadObjectCommand({ Bucket: r2.bucket, Key: storageKey }),
          );
          if ((headOrig.ContentLength ?? -1) === asset.sizeBytes) {
            report.push({
              id: asset.id,
              storageKey,
              status: "skipped-already-on-r2",
              detail: "Present on R2; local file absent",
            });
            continue;
          }
        } catch {
          /* ignore */
        }
        report.push({
          id: asset.id,
          storageKey,
          status: "missing-local",
          detail: "Local file not found and object not verified on R2",
        });
        continue;
      }

      const localStat = await stat(absolute);
      if (!execute) {
        report.push({
          id: asset.id,
          storageKey,
          status: "would-upload",
          newKey: targetKey !== storageKey ? targetKey : undefined,
          detail: `localBytes=${localStat.size}`,
        });
        continue;
      }

      try {
        await client.send(
          new PutObjectCommand({
            Bucket: r2.bucket,
            Key: targetKey,
            Body: createReadStream(absolute),
            ContentType: asset.mimeType,
            CacheControl: "public, max-age=31536000, immutable",
            ContentLength: localStat.size,
          }),
        );

        const verified = await client.send(
          new HeadObjectCommand({ Bucket: r2.bucket, Key: targetKey }),
        );
        if ((verified.ContentLength ?? -1) !== localStat.size) {
          throw new Error(
            `Size mismatch after upload (remote=${verified.ContentLength}, local=${localStat.size})`,
          );
        }

        if (rewriteKeys && targetKey !== storageKey) {
          await prisma.mediaAsset.update({
            where: { id: asset.id },
            data: { storageKey: targetKey },
          });
          report.push({
            id: asset.id,
            storageKey,
            status: "rewritten",
            newKey: targetKey,
          });
        } else {
          report.push({
            id: asset.id,
            storageKey,
            status: "uploaded",
            newKey: targetKey !== storageKey ? targetKey : undefined,
          });
        }
      } catch (error) {
        report.push({
          id: asset.id,
          storageKey,
          status: "failed",
          detail: error instanceof Error ? error.message : "upload failed",
        });
      }
    }
  } finally {
    await prisma.$disconnect();
    client.destroy();
  }

  const summary = report.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});

  console.log("\nSummary:", summary);
  console.log("\nReport:");
  for (const row of report) {
    console.log(
      `- ${row.status}: ${row.id} key=${row.storageKey}${
        row.newKey ? ` → ${row.newKey}` : ""
      }${row.detail ? ` (${row.detail})` : ""}`,
    );
  }

  if (!execute) {
    console.log(
      "\nDry-run only. Re-run with --execute to upload. Local files are never deleted.",
    );
  }

  const failed = report.some((r) => r.status === "failed");
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
