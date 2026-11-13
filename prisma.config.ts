import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma CLI (migrate / introspect / studio) must use a direct or session-mode
 * connection. With Supabase, that is DIRECT_URL (port 5432). Runtime Prisma
 * Client continues to use DATABASE_URL (transaction pooler, port 6543) via the
 * pg driver adapter in src/server/db/client.ts.
 *
 * `prisma generate` (postinstall) does not open a DB connection; a placeholder
 * URL is enough so `npm install` works before `.env` exists. Migrate/studio
 * still need a real DIRECT_URL (or DATABASE_URL).
 */
const datasourceUrl =
  process.env.DIRECT_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  "postgresql://USER:PASSWORD@localhost:5432/DATABASE?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: datasourceUrl,
  },
});
