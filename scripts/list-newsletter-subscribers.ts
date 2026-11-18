import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "../src/generated/prisma";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    const rows = await prisma.newsletterSubscriber.findMany({
      orderBy: { subscribedAt: "desc" },
      take: 20,
      select: {
        email: true,
        status: true,
        subscribedAt: true,
        notificationSentAt: true,
        lastNotificationError: true,
      },
    });
    console.log(JSON.stringify(rows, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
