import "server-only";

import nodemailer from "nodemailer";

import { EMAIL_BRAND } from "@/server/mail/brand";
import { loadSmtpConfig, type SmtpConfig } from "@/server/mail/smtp-config";

export type SendMailInput = {
  subject: string;
  text: string;
  html: string;
  to?: string;
  replyTo?: string;
  /** BCP 47 language tag for Content-Language (e.g. en, ar). */
  contentLanguage?: string;
};

export type SendMailResult = {
  messageId: string;
  response?: string;
};

let cachedTransport: ReturnType<typeof nodemailer.createTransport> | null =
  null;
let cachedTransportKey = "";

function transportCacheKey(config: SmtpConfig): string {
  return [config.host, config.port, config.secure, config.user].join("|");
}

/** Create or reuse a Nodemailer transport from env (Gmail SMTP App Password). */
export function createSmtpTransport(config: SmtpConfig = loadSmtpConfig()) {
  const key = transportCacheKey(config);
  if (cachedTransport && cachedTransportKey === key) {
    return cachedTransport;
  }
  cachedTransport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure && config.port === 587,
    auth: {
      user: config.user,
      pass: config.appPassword,
    },
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 20_000,
    tls: {
      minVersion: "TLSv1.2",
      servername: config.host,
    },
  });
  cachedTransportKey = key;
  return cachedTransport;
}

/** Test helper — clears the process-local transport cache. */
export function resetSmtpTransportCache(): void {
  cachedTransport = null;
  cachedTransportKey = "";
}

/**
 * Send an email via configured SMTP. Server-only.
 * From identity always matches the authenticated Gmail account.
 * Does not log credentials.
 */
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const config = loadSmtpConfig();
  const transport = createSmtpTransport(config);
  const info = await transport.sendMail({
    from: `"Human Rights Agenda" <${config.user}>`,
    to: input.to || config.notifyEmail,
    replyTo: input.replyTo || config.user || EMAIL_BRAND.contactEmail,
    subject: input.subject,
    text: input.text,
    html: input.html,
    headers: {
      "X-Agenda-Mail": "newsletter",
      ...(input.contentLanguage
        ? { "Content-Language": input.contentLanguage }
        : {}),
    },
  });
  return {
    messageId: String(info.messageId || ""),
    response: info.response ? String(info.response) : undefined,
  };
}
