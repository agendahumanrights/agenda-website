import { describe, it } from "vitest";

/**
 * Integration coverage (login, sessions, throttle, CSRF against HTTP handlers,
 * provisioning idempotency) requires DATABASE_URL_TEST pointing at a migrated
 * PostgreSQL database. When unset, these scenarios are documented as skipped.
 *
 * To enable:
 * 1. Create a dedicated test database
 * 2. DATABASE_URL_TEST=... npx prisma migrate deploy
 * 3. Add HTTP/session integration tests against that database
 */
describe.skipIf(!process.env.DATABASE_URL_TEST)(
  "admin auth integration (requires DATABASE_URL_TEST)",
  () => {
    it("placeholder — add DB-backed cases when a test database is available", () => {
      // Intentionally empty until DATABASE_URL_TEST is configured.
    });
  },
);
