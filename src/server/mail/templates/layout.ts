import {
  EMAIL_BRAND,
  emailAbsoluteUrl,
  emailMissionSummary,
  emailOrgName,
} from "@/server/mail/brand";
import { escapeHtml } from "@/server/mail/escape";
import type { Locale } from "@/i18n/config";

export type EmailDocument = {
  subject: string;
  html: string;
  text: string;
};

type LayoutInput = {
  locale: Locale;
  /** Prefixed onto the document title / preview text. */
  preheader: string;
  title: string;
  bodyHtml: string;
  footerNote?: string;
};

/**
 * Shared email-safe shell: table layout, inline CSS, ~600px container.
 * No logo image and no mailto / contact-email links in the chrome.
 */
export function renderEmailLayout(input: LayoutInput): string {
  const dir = input.locale === "ar" ? "rtl" : "ltr";
  const org = emailOrgName(input.locale);
  const siteUrl = emailAbsoluteUrl(input.locale === "ar" ? "/ar" : "/");
  const mission = emailMissionSummary(input.locale);
  const footerNote =
    input.footerNote ||
    (input.locale === "ar"
      ? "هذه رسالة رسمية من مفكرة لحقوق الإنسان."
      : "This is an official message from Human Rights Agenda.");

  return `<!DOCTYPE html>
<html lang="${input.locale}" dir="${dir}">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(input.title)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.pageBg};font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:${EMAIL_BRAND.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(input.preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BRAND.pageBg};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${EMAIL_BRAND.white};border:1px solid ${EMAIL_BRAND.border};border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:${EMAIL_BRAND.primary};padding:22px 24px;">
              <p style="margin:0;font-size:18px;line-height:1.3;font-weight:700;color:${EMAIL_BRAND.white};">
                ${escapeHtml(org)}
              </p>
              <p style="margin:6px 0 0;font-size:12px;line-height:1.4;color:rgba(255,255,255,0.85);">
                <a href="${escapeHtml(siteUrl)}" style="color:rgba(255,255,255,0.9);text-decoration:underline;">${escapeHtml(EMAIL_BRAND.domain)}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 8px;">
              ${input.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BRAND.soft};border:1px solid ${EMAIL_BRAND.border};border-radius:10px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 6px;font-size:13px;line-height:1.5;font-weight:600;color:${EMAIL_BRAND.text};">
                      ${escapeHtml(org)}
                    </p>
                    <p style="margin:0 0 10px;font-size:12px;line-height:1.6;color:${EMAIL_BRAND.muted};">
                      ${escapeHtml(mission)}
                    </p>
                    <p style="margin:0;font-size:12px;line-height:1.5;color:${EMAIL_BRAND.muted};">
                      <a href="${escapeHtml(siteUrl)}" style="color:${EMAIL_BRAND.primary};text-decoration:underline;">${escapeHtml(EMAIL_BRAND.domain)}</a>
                    </p>
                    <p style="margin:10px 0 0;font-size:11px;line-height:1.5;color:${EMAIL_BRAND.muted};">
                      ${escapeHtml(footerNote)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
