/**
 * Live Gmail SMTP smoke test for newsletter mail.
 * Usage: npx tsx scripts/test-newsletter-smtp.ts [optional-subscriber-email]
 * Never prints the App Password.
 */
import "dotenv/config";

import nodemailer from "nodemailer";

function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return fallback;
}

async function main() {
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number.parseInt(process.env.SMTP_PORT?.trim() || "465", 10);
  const secure = envBool("SMTP_SECURE", true);
  const user = process.env.SMTP_USER?.trim() || "";
  const pass = (process.env.SMTP_APP_PASSWORD || "").trim().replace(/\s+/g, "");
  const notify =
    process.env.NEWSLETTER_NOTIFY_EMAIL?.trim() ||
    user ||
    "agendahumanrights@gmail.com";
  const subscriberArg = process.argv[2]?.trim();

  console.log(
    JSON.stringify(
      {
        host,
        port,
        secure,
        user,
        notify,
        passConfigured: Boolean(pass),
        passLen: pass.length,
        alsoSendToSubscriber: subscriberArg || null,
      },
      null,
      2,
    ),
  );

  if (!user || !pass) {
    console.error("SMTP_USER / SMTP_APP_PASSWORD missing.");
    process.exit(1);
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
    tls: {
      // Gmail presents a valid cert; keep default verification on.
      minVersion: "TLSv1.2",
      servername: host,
    },
  });

  try {
    await transport.verify();
    console.log("VERIFY_OK");
  } catch (error) {
    const err = error as {
      message?: string;
      code?: string;
      command?: string;
      response?: string;
      responseCode?: number;
      stack?: string;
    };
    console.error(
      "VERIFY_FAIL",
      JSON.stringify(
        {
          message: err?.message || String(error),
          code: err?.code,
          command: err?.command,
          response: err?.response,
          responseCode: err?.responseCode,
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }

  try {
    const info = await transport.sendMail({
      from: `"Human Rights Agenda" <${user}>`,
      to: notify,
      subject: "Agenda SMTP test — newsletter notify",
      text: "SMTP diagnostic: admin notification path works.",
      html: "<p>SMTP diagnostic: admin notification path works.</p>",
    });
    console.log("NOTIFY_SEND_OK", info.messageId, info.response);
  } catch (error) {
    console.error(
      "NOTIFY_SEND_FAIL",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }

  if (subscriberArg) {
    try {
      const info = await transport.sendMail({
        from: `"Human Rights Agenda" <${user}>`,
        to: subscriberArg,
        subject: "Agenda SMTP test — subscriber confirmation",
        text: "SMTP diagnostic: subscriber confirmation path works.",
        html: "<p>SMTP diagnostic: subscriber confirmation path works.</p>",
      });
      console.log("SUBSCRIBER_SEND_OK", info.messageId, info.response);
    } catch (error) {
      console.error(
        "SUBSCRIBER_SEND_FAIL",
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
