import "server-only";

import { existsSync, statSync } from "node:fs";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma";

/**
 * Lazy, hot-reload-safe Prisma client.
 * Instantiation is deferred until first use so placeholder pages can render
 * without a working DATABASE_URL.
 *
 * In development, recreate the client when the generated schema changes
 * (e.g. after `prisma generate`) so new fields are not silently rejected by a
 * stale in-memory client kept on `globalThis`.
 */

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaMtime?: number;
};

const GENERATED_SCHEMA_PATH = path.join(
  process.cwd(),
  "src",
  "generated",
  "prisma",
  "schema.prisma",
);

function generatedSchemaMtime(): number {
  try {
    if (!existsSync(GENERATED_SCHEMA_PATH)) return 0;
    return statSync(GENERATED_SCHEMA_PATH).mtimeMs;
  } catch {
    return 0;
  }
}

/** True when DATABASE_URL looks like a real connection string (not scaffolding placeholders). */
export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return false;
  // Common scaffolding placeholders from .env.example / local stubs
  if (
    /:\/\/USER:PASSWORD@/i.test(url) ||
    /@HOST:/i.test(url) ||
    /\/DATABASE(\?|$)/i.test(url)
  ) {
    return false;
  }
  return true;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString || !isDatabaseConfigured()) {
    throw new Error(
      "DATABASE_URL is not set to a usable database. Configure .env before using database-backed services.",
    );
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  const schemaMtime = generatedSchemaMtime();
  const shouldRefresh =
    !globalForPrisma.prisma ||
    (process.env.NODE_ENV !== "production" &&
      globalForPrisma.prismaSchemaMtime !== schemaMtime);

  if (shouldRefresh) {
    const previous = globalForPrisma.prisma;
    globalForPrisma.prisma = createPrismaClient();
    globalForPrisma.prismaSchemaMtime = schemaMtime;
    if (previous) {
      void previous.$disconnect().catch(() => undefined);
    }
  }

  return globalForPrisma.prisma!;
}

/**
 * Run a DB-backed read; on missing/invalid DB or query failure return `fallback`
 * so public pages do not crash (e.g. placeholder credentials).
 */
export async function withDatabaseFallback<T>(
  operation: () => Promise<T>,
  fallback: T,
): Promise<T> {
  if (!isDatabaseConfigured()) {
    return fallback;
  }
  try {
    return await operation();
  } catch (error) {
    console.error(
      "Database operation failed; serving empty/fallback public data.",
      error,
    );
    return fallback;
  }
}
