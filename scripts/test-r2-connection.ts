/**
 * Smoke-test Cloudflare R2 credentials and bucket access.
 * Uploads a tiny temporary object, HEADs it, then deletes it.
 *
 * Usage: npm run media:test-r2
 * Never prints secret values.
 */

import "dotenv/config";

import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

import { loadR2EnvConfig } from "../src/server/storage/r2-env";

async function main() {
  const r2 = loadR2EnvConfig();
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

  const key = `agenda/other/_connection-test/${randomUUID()}.txt`;
  const body = Buffer.from(`agenda-r2-connection-test:${new Date().toISOString()}`);

  console.log(
    JSON.stringify(
      {
        bucket: r2.bucket,
        endpointHost: new URL(r2.endpoint).host,
        publicBaseHost: new URL(r2.publicBaseUrl).host,
        testKey: key,
      },
      null,
      2,
    ),
  );

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: r2.bucket,
        Key: key,
        Body: body,
        ContentType: "text/plain",
        CacheControl: "no-store",
        ContentLength: body.byteLength,
      }),
    );
    console.log("PutObject: ok");

    const head = await client.send(
      new HeadObjectCommand({ Bucket: r2.bucket, Key: key }),
    );
    if ((head.ContentLength ?? -1) !== body.byteLength) {
      throw new Error("HEAD size mismatch");
    }
    console.log("HeadObject: ok");

    const publicUrl = `${r2.publicBaseUrl.replace(/\/+$/, "")}/${key}`;
    console.log(`Public URL (verify in browser if bucket is public): ${publicUrl}`);
  } finally {
    try {
      await client.send(
        new DeleteObjectCommand({ Bucket: r2.bucket, Key: key }),
      );
      console.log("DeleteObject: ok");
    } catch (error) {
      console.error(
        "Cleanup delete failed:",
        error instanceof Error ? error.message : error,
      );
    }
    client.destroy();
  }

  console.log("R2 connection test passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
