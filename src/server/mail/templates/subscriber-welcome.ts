import type { Locale } from "@/i18n/config";
import { EMAIL_BRAND, emailOrgName } from "@/server/mail/brand";
import { escapeHtml } from "@/server/mail/escape";
import {
  renderEmailLayout,
  type EmailDocument,
} from "@/server/mail/templates/layout";

export type SubscriberWelcomeInput = {
  email: string;
  locale: Locale;
};

const copy = {
  en: {
    subject: "Welcome to Human Rights Agenda",
    preheader: "Thank you for subscribing to our newsletter.",
    heading: "Welcome to Human Rights Agenda!",
    thanks: "Thank you for subscribing to our newsletter.",
    body: "You are now signed up to receive updates about our latest publications, events, research, and human rights activities. We look forward to keeping you informed.",
    footerNote:
      "You received this message because you subscribed on humanrightsagenda.org.",
  },
  ar: {
    subject: "مرحبًا بك في مفكرة لحقوق الإنسان",
    preheader: "شكرًا لاشتراكك في نشرتنا البريدية.",
    heading: "مرحبًا بك في مفكرة لحقوق الإنسان!",
    thanks: "شكرًا لاشتراكك في نشرتنا البريدية.",
    body: "أنت الآن مسجّل لتلقي تحديثات حول أحدث منشوراتنا وفعالياتنا وأبحاثنا وأنشطة حقوق الإنسان. نتطلع إلى إبقائك على اطلاع.",
    footerNote: "وصلتكم هذه الرسالة لأنكم اشتركتم عبر humanrightsagenda.org.",
  },
} as const;

export function buildSubscriberWelcomeEmail(
  input: SubscriberWelcomeInput,
): EmailDocument {
  const locale = input.locale === "ar" ? "ar" : "en";
  const t = copy[locale];
  const org = emailOrgName(locale);
  void input.email;

  const bodyHtml = `
    <h1 style="margin:0 0 14px;font-size:24px;line-height:1.35;font-weight:700;color:${EMAIL_BRAND.primary};">
      ${escapeHtml(t.heading)}
    </h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:${EMAIL_BRAND.body};">
      ${escapeHtml(t.thanks)}
    </p>
    <p style="margin:0;font-size:15px;line-height:1.7;color:${EMAIL_BRAND.body};">
      ${escapeHtml(t.body)}
    </p>
  `;

  const html = renderEmailLayout({
    locale,
    preheader: t.preheader,
    title: t.subject,
    bodyHtml,
    footerNote: t.footerNote,
  });

  const text = [
    org,
    "",
    t.heading,
    "",
    t.thanks,
    t.body,
    "",
    EMAIL_BRAND.domain,
    "",
    t.footerNote,
  ].join("\n");

  return { subject: t.subject, html, text };
}
