/**
 * Explicit administrator provisioning. Not run by build/dev/postinstall.
 *
 * Usage:
 *   set ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD in .env
 *   npm run admin:create
 *
 * If the email already exists, exits successfully without changing the password.
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";
import { hashPassword, normalizeEmail } from "../src/server/auth/password";

async function main() {
  const rawEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  if (!rawEmail || !password) {
    console.error(
      "Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD in the environment.",
    );
    process.exit(1);
  }
  if (password.length < 1 || password.length > 128) {
    console.error("ADMIN_BOOTSTRAP_PASSWORD length is invalid.");
    process.exit(1);
  }

  const email = normalizeEmail(rawEmail);
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      console.log(`Administrator already exists: ${email} (password unchanged).`);
      return;
    }

    const passwordHash = await hashPassword(password);
    await prisma.adminUser.create({
      data: {
        email,
        passwordHash,
        name: "Administrator",
      },
    });
    console.log(`Created administrator: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
