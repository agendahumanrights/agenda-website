import "server-only";

import type { Prisma } from "@/generated/prisma";

import { normalizeEmail } from "@/server/auth/password";
import { getPrisma, isDatabaseConfigured } from "@/server/db";
import { badRequest, serviceUnavailable } from "@/server/http/errors";
import type { Locale } from "@/i18n/config";
import { isSmtpConfigured } from "@/server/mail/smtp-config";
import { sendNewsletterSubscriptionEmails } from "@/server/mail/newsletter-notification";
import type { AdminNewsletterListQuery } from "@/server/validations/newsletter";
import type { PaginatedResult } from "@/types/api";
import type { AdminNewsletterSubscriberListItem } from "@/types/newsletter";

export type SubscribeResult =
  | { outcome: "subscribed" }
  | { outcome: "already_subscribed" };

function requireDb() {
  if (!isDatabaseConfigured()) {
    throw serviceUnavailable("Newsletter is temporarily unavailable.");
  }
}

function smtpErrorMessage(error: unknown): string {
  if (!error) return "SMTP send failed.";
  if (error instanceof AggregateError) {
    const parts = error.errors
      .map((item) =>
        item instanceof Error
          ? item.message || item.name
          : typeof item === "string"
            ? item
            : "unknown",
      )
      .filter(Boolean);
    return (
      [`AggregateError`, error.message, ...parts].filter(Boolean).join(": ") ||
      "SMTP connection failed."
    ).slice(0, 500);
  }
  if (error instanceof Error) {
    const withCode = error as Error & { code?: string; response?: string };
    return [withCode.code, withCode.message, withCode.response]
      .filter(Boolean)
      .join(" — ")
      .slice(0, 500);
  }
  return "SMTP send failed.";
}

async function deliverSubscriptionEmails(
  subscriber: {
    id: string;
    email: string;
    subscribedAt: Date;
  },
  locale: Locale = "en",
): Promise<void> {
  const prisma = getPrisma();

  if (!isSmtpConfigured()) {
    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { lastNotificationError: "SMTP is not configured." },
    });
    return;
  }

  try {
    await sendNewsletterSubscriptionEmails({
      email: subscriber.email,
      subscribedAt: subscriber.subscribedAt,
      locale,
    });
    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        notificationSentAt: new Date(),
        lastNotificationError: null,
      },
    });
  } catch (error) {
    const message = smtpErrorMessage(error);
    console.error("Newsletter notification failed", {
      subscriberId: subscriber.id,
      message,
    });
    await prisma.newsletterSubscriber
      .update({
        where: { id: subscriber.id },
        data: { lastNotificationError: message },
      })
      .catch(() => {
        /* keep subscription even if error logging fails */
      });
  }
}

export async function listAdminNewsletterSubscribers(
  query: AdminNewsletterListQuery,
): Promise<PaginatedResult<AdminNewsletterSubscriberListItem>> {
  requireDb();
  const prisma = getPrisma();

  const where: Prisma.NewsletterSubscriberWhereInput = {
    ...(query.q
      ? { email: { contains: query.q.trim().toLowerCase(), mode: "insensitive" } }
      : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.newsletterSubscriber.count({ where }),
    prisma.newsletterSubscriber.findMany({
      where,
      orderBy: [{ subscribedAt: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  const items: AdminNewsletterSubscriberListItem[] = rows.map((row) => ({
    id: row.id,
    email: row.email,
    status: row.status,
    subscribedAt: row.subscribedAt.toISOString(),
    consentAt: row.consentAt.toISOString(),
    notificationSentAt: row.notificationSentAt?.toISOString() ?? null,
    lastNotificationError: row.lastNotificationError,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));

  return {
    items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.pageSize),
    },
  };
}

/**
 * Subscribe an email to the newsletter.
 * - Normalizes email
 * - Prevents duplicate ACTIVE rows
 * - Reactivates UNSUBSCRIBED addresses
 * - Sends admin SMTP notification + subscriber confirmation
 * - Retries mail when an ACTIVE row still has no notificationSentAt
 * - Keeps the DB row if SMTP fails (notificationSentAt stays null)
 */
export async function subscribeToNewsletter(
  rawEmail: string,
  locale: Locale = "en",
): Promise<SubscribeResult> {
  requireDb();

  const email = normalizeEmail(rawEmail);
  if (!email) {
    throw badRequest("Please enter a valid email address.");
  }

  const prisma = getPrisma();
  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email },
  });

  // Duplicate ACTIVE: never resend welcome/admin mail if already notified.
  // Only retry when a prior SMTP attempt left notificationSentAt unset.
  if (existing?.status === "ACTIVE") {
    if (!existing.notificationSentAt) {
      await deliverSubscriptionEmails(existing, locale);
    }
    return { outcome: "already_subscribed" };
  }

  const now = new Date();
  const subscriber =
    existing?.status === "UNSUBSCRIBED"
      ? await prisma.newsletterSubscriber.update({
          where: { id: existing.id },
          data: {
            status: "ACTIVE",
            subscribedAt: now,
            consentAt: now,
            notificationSentAt: null,
            lastNotificationError: null,
          },
        })
      : await prisma.newsletterSubscriber.create({
          data: {
            email,
            status: "ACTIVE",
            subscribedAt: now,
            consentAt: now,
          },
        });

  await deliverSubscriptionEmails(subscriber, locale);
  return { outcome: "subscribed" };
}

/** Resend pending admin+subscriber emails for ACTIVE rows without notificationSentAt. */
export async function retryPendingNewsletterNotifications(): Promise<{
  attempted: number;
  succeeded: number;
  failed: number;
}> {
  requireDb();
  const prisma = getPrisma();
  const pending = await prisma.newsletterSubscriber.findMany({
    where: { status: "ACTIVE", notificationSentAt: null },
    orderBy: { subscribedAt: "asc" },
  });

  let succeeded = 0;
  let failed = 0;
  for (const row of pending) {
    await deliverSubscriptionEmails(row);
    const refreshed = await prisma.newsletterSubscriber.findUnique({
      where: { id: row.id },
      select: { notificationSentAt: true },
    });
    if (refreshed?.notificationSentAt) succeeded += 1;
    else failed += 1;
  }

  return { attempted: pending.length, succeeded, failed };
}
