import type { Locale } from "@/i18n/config";

export const EMAIL_BRAND = {
  primary: "#05498C",
  primaryDark: "#043a70",
  text: "#18181b",
  muted: "#64748b",
  body: "#3f3f46",
  border: "#e4e7ec",
  soft: "#f8fafc",
  pageBg: "#f4f6f9",
  white: "#ffffff",
  domain: "humanrightsagenda.org",
  /** Reply-To / SMTP identity only — not rendered in template bodies. */
  contactEmail: "agendahumanrights@gmail.com",
} as const;

export function emailSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return `https://${EMAIL_BRAND.domain}`;
  try {
    return new URL(raw).origin;
  } catch {
    return `https://${EMAIL_BRAND.domain}`;
  }
}

export function emailAbsoluteUrl(path: string): string {
  const origin = emailSiteOrigin().replace(/\/+$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalized}`;
}

export function emailOrgName(locale: Locale): string {
  return locale === "ar" ? "مفكرة لحقوق الإنسان" : "Human Rights Agenda";
}

export function emailMissionSummary(locale: Locale): string {
  return locale === "ar"
    ? "منظمة مفكرة لحقوق الإنسان هي منظمة يمنية مستقلة وغير ربحية، تأسست عام 2023، تعمل على تعزيز المساءلة والعدالة الانتقالية وجبر الضرر الفعّال من خلال الربط بين الأدلة الموثوقة، والمجتمعات المتضررة، والعمل المدني."
    : "Human Rights Agenda (HRA) is an independent, non-profit Yemeni human rights organization founded in 2023. HRA connects credible evidence, affected communities, and civil society action to advance accountability, transitional justice, and meaningful reparation.";
}
