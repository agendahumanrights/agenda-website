import { EMAIL_BRAND, emailOrgName } from "@/server/mail/brand";
import { escapeHtml } from "@/server/mail/escape";
import {
  renderEmailLayout,
  type EmailDocument,
} from "@/server/mail/templates/layout";

export type AdminNewSubscriberInput = {
  email: string;
  subscribedAt: Date;
};

function formatSubscriptionDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

export function buildAdminNewSubscriberEmail(
  input: AdminNewSubscriberInput,
): EmailDocument {
  const org = emailOrgName("en");
  const subject = "New Newsletter Subscriber | Human Rights Agenda";
  const dateLabel = formatSubscriptionDateTime(input.subscribedAt);
  void input.email;

  const bodyHtml = `
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.35;font-weight:700;color:${EMAIL_BRAND.primary};">
      New Newsletter Subscription
    </h1>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:${EMAIL_BRAND.body};">
      A new visitor has subscribed to receive updates from Human Rights Agenda.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BRAND.soft};border:1px solid ${EMAIL_BRAND.border};border-radius:10px;">
      <tr>
        <td style="padding:0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:12px 16px;border-bottom:1px solid ${EMAIL_BRAND.border};font-size:12px;color:${EMAIL_BRAND.muted};width:38%;">Subscription Date</td>
              <td style="padding:12px 16px;border-bottom:1px solid ${EMAIL_BRAND.border};font-size:14px;color:${EMAIL_BRAND.text};">${escapeHtml(dateLabel)}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;border-bottom:1px solid ${EMAIL_BRAND.border};font-size:12px;color:${EMAIL_BRAND.muted};">Website</td>
              <td style="padding:12px 16px;border-bottom:1px solid ${EMAIL_BRAND.border};font-size:14px;color:${EMAIL_BRAND.text};">${EMAIL_BRAND.domain}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-size:12px;color:${EMAIL_BRAND.muted};">Status</td>
              <td style="padding:12px 16px;font-size:14px;font-weight:600;color:${EMAIL_BRAND.primary};">Subscribed</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:${EMAIL_BRAND.muted};">
      Review the full subscriber list in the Agenda admin dashboard under Newsletter.
    </p>
  `;

  const html = renderEmailLayout({
    locale: "en",
    preheader: "A new visitor subscribed to the Agenda newsletter.",
    title: subject,
    bodyHtml,
    footerNote: "Newsletter Subscription Notification — internal use only.",
  });

  const text = [
    org,
    "",
    "New Newsletter Subscription",
    "",
    "A new visitor has subscribed to receive updates from Human Rights Agenda.",
    "",
    `Subscription Date: ${dateLabel}`,
    `Website: ${EMAIL_BRAND.domain}`,
    "Status: Subscribed",
    "",
    "Review the full subscriber list in the Agenda admin dashboard under Newsletter.",
    "",
    "Newsletter Subscription Notification",
    EMAIL_BRAND.domain,
  ].join("\n");

  return { subject, html, text };
}
