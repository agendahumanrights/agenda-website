import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma CLI (migrate / introspect / studio) must use a direct or session-mode
 * connection. With Supabase, that is DIRECT_URL (port 5432). Runtime Prisma
 * Client continues to use DATABASE_URL (transaction pooler, port 6543) via the
 * pg driver adapter in src/server/db/client.ts.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
