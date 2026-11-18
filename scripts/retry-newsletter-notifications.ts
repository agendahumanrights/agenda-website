/**
 * Resend pending newsletter emails for ACTIVE subscribers without notificationSentAt.
 * Standalone script (does not import server-only modules).
 *
 * Usage: npx tsx scripts/retry-newsletter-notifications.ts
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import nodemailer from "nodemailer";
import pg from "pg";

import { PrismaClient } from "../src/generated/prisma";

function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return fallback;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

async function main() {
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number.parseInt(process.env.SMTP_PORT?.trim() || "587", 10);
  const secure = envBool("SMTP_SECURE", port === 465);
  const user = process.env.SMTP_USER?.trim() || "";
  const pass = (process.env.SMTP_APP_PASSWORD || "").trim().replace(/\s+/g, "");
  const notify =
    process.env.NEWSLETTER_NOTIFY_EMAIL?.trim() ||
    user ||
    "agendahumanrights@gmail.com";

  if (!user || !pass) {
    throw new Error("SMTP_USER / SMTP_APP_PASSWORD missing.");
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: { user, pass },
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 20_000,
    tls: { minVersion: "TLSv1.2", servername: host },
  });

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const pending = await prisma.newsletterSubscriber.findMany({
      where: { status: "ACTIVE", notificationSentAt: null },
      orderBy: { subscribedAt: "asc" },
    });

    let succeeded = 0;
    let failed = 0;

    for (const row of pending) {
      try {
        const dateLabel = formatDate(row.subscribedAt);
        const safeEmail = escapeHtml(row.email);

        await transport.sendMail({
          from: `"Human Rights Agenda" <${user}>`,
          to: notify,
          subject: "New Newsletter Subscriber — Human Rights Agenda",
          text: [
            "Human Rights Agenda",
            "",
            "New Newsletter Subscription",
            "",
            `Subscriber Email: ${row.email}`,
            `Subscription Date: ${dateLabel}`,
            "Source: Agenda Website (retry)",
          ].join("\n"),
          html: `<p><strong>New Newsletter Subscription</strong></p><p>Subscriber Email: ${safeEmail}</p><p>Subscription Date: ${escapeHtml(dateLabel)}</p>`,
        });

        await transport.sendMail({
          from: `"Human Rights Agenda" <${user}>`,
          to: row.email,
          subject: "You're subscribed — Human Rights Agenda",
          text: `Thank you for subscribing. We confirmed ${row.email}.`,
          html: `<p>Thank you for subscribing.</p><p>We confirmed <strong dir="ltr">${safeEmail}</strong>.</p>`,
        });

        await prisma.newsletterSubscriber.update({
          where: { id: row.id },
          data: {
            notificationSentAt: new Date(),
            lastNotificationError: null,
          },
        });
        succeeded += 1;
        console.log("OK", row.email);
      } catch (error) {
        failed += 1;
        const message =
          error instanceof Error ? error.message.slice(0, 500) : "SMTP failed";
        await prisma.newsletterSubscriber.update({
          where: { id: row.id },
          data: { lastNotificationError: message },
        });
        console.error("FAIL", row.email, message);
      }
    }

    console.log(JSON.stringify({ attempted: pending.length, succeeded, failed }));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
