import "server-only";

import { serviceUnavailable } from "@/server/http/errors";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  appPassword: string;
  notifyEmail: string;
};

function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return fallback;
}

/**
 * Load SMTP settings from the environment.
 * Never log the App Password. Throws a generic 503 when required values are missing.
 *
 * Defaults: smtp.gmail.com:587 with STARTTLS (secure=false). Port 465/SSL is often
 * refused on local ISP networks; 587 is the reliable Gmail path.
 */
export function loadSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const portRaw = process.env.SMTP_PORT?.trim();
  const port = portRaw ? Number.parseInt(portRaw, 10) : 587;
  // If port is 465 and SMTP_SECURE unset, default secure=true; otherwise prefer STARTTLS.
  const secureFallback = port === 465;
  const secure = envBool("SMTP_SECURE", secureFallback);
  const user = process.env.SMTP_USER?.trim() || "";
  // Gmail App Passwords are often copied with spaces — strip them.
  const appPassword = (process.env.SMTP_APP_PASSWORD || "")
    .trim()
    .replace(/\s+/g, "");
  const notifyEmail =
    process.env.NEWSLETTER_NOTIFY_EMAIL?.trim() ||
    user ||
    "agendahumanrights@gmail.com";

  if (!Number.isFinite(port) || port <= 0) {
    throw serviceUnavailable("Email service is not configured.");
  }
  if (!user || !appPassword) {
    throw serviceUnavailable("Email service is not configured.");
  }

  return {
    host,
    port,
    secure,
    user,
    appPassword,
    notifyEmail,
  };
}

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_USER?.trim() &&
      (process.env.SMTP_APP_PASSWORD || "").trim().replace(/\s+/g, ""),
  );
}
