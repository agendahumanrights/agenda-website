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
    ? "نُعزز حقوق الإنسان والمساءلة في اليمن من خلال الربط بين الأدلة والمجتمع المدني والمناصرة والمجتمعات المتضررة."
    : "We advance human rights and accountability in Yemen by connecting evidence, civil society, advocacy, and affected communities.";
}
