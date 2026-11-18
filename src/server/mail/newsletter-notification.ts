import "server-only";

import type { Locale } from "@/i18n/config";
import { EMAIL_BRAND } from "@/server/mail/brand";
import { sendMail } from "@/server/mail/send-mail";
import { buildAdminNewSubscriberEmail } from "@/server/mail/templates/admin-new-subscriber";
import { buildSubscriberWelcomeEmail } from "@/server/mail/templates/subscriber-welcome";

export {
  buildAdminNewSubscriberEmail,
  buildSubscriberWelcomeEmail,
};

/** @deprecated Prefer buildAdminNewSubscriberEmail */
export function buildNewsletterNotificationContent(input: {
  email: string;
  subscribedAt: Date;
}) {
  return buildAdminNewSubscriberEmail(input);
}

/** @deprecated Prefer buildSubscriberWelcomeEmail */
export function buildSubscriberConfirmationContent(input: {
  email: string;
  locale?: Locale;
}) {
  return buildSubscriberWelcomeEmail({
    email: input.email,
    locale: input.locale === "ar" ? "ar" : "en",
  });
}

export async function sendNewSubscriberNotification(input: {
  email: string;
  subscribedAt: Date;
}): Promise<void> {
  const content = buildAdminNewSubscriberEmail(input);
  await sendMail({
    ...content,
    contentLanguage: "en",
    replyTo: EMAIL_BRAND.contactEmail,
  });
}

export async function sendSubscriberConfirmation(input: {
  email: string;
  locale?: Locale;
}): Promise<void> {
  const locale = input.locale === "ar" ? "ar" : "en";
  const content = buildSubscriberWelcomeEmail({
    email: input.email,
    locale,
  });
  await sendMail({
    ...content,
    to: input.email,
    contentLanguage: locale,
    replyTo: EMAIL_BRAND.contactEmail,
  });
}

/**
 * Admin notify + subscriber welcome.
 * Throws if either send fails (caller records error / keeps subscription).
 */
export async function sendNewsletterSubscriptionEmails(input: {
  email: string;
  subscribedAt: Date;
  locale?: Locale;
}): Promise<void> {
  await sendNewSubscriberNotification({
    email: input.email,
    subscribedAt: input.subscribedAt,
  });
  await sendSubscriberConfirmation({
    email: input.email,
    locale: input.locale,
  });
}
