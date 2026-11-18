import { describe, expect, it } from "vitest";

import { buildAdminNewSubscriberEmail } from "@/server/mail/templates/admin-new-subscriber";
import { buildSubscriberWelcomeEmail } from "@/server/mail/templates/subscriber-welcome";

describe("newsletter email templates", () => {
  it("builds an English welcome email without logo or email addresses", () => {
    const doc = buildSubscriberWelcomeEmail({
      email: "user@example.com",
      locale: "en",
    });
    expect(doc.subject).toBe("Welcome to Human Rights Agenda");
    expect(doc.html).toContain("Welcome to Human Rights Agenda!");
    expect(doc.html).toContain("#05498C");
    expect(doc.html).not.toContain("<img");
    expect(doc.html).not.toContain("agenda-logo");
    expect(doc.html).not.toContain("user@example.com");
    expect(doc.html).not.toContain("agendahumanrights@gmail.com");
    expect(doc.html).not.toContain("mailto:");
    expect(doc.text).not.toContain("user@example.com");
    expect(doc.text).toContain("humanrightsagenda.org");
  });

  it("builds an Arabic welcome email with RTL markup and no logo/email", () => {
    const doc = buildSubscriberWelcomeEmail({
      email: "subscriber@example.com",
      locale: "ar",
    });
    expect(doc.subject).toContain("مرحبًا بك");
    expect(doc.html).toContain('dir="rtl"');
    expect(doc.html).toContain('lang="ar"');
    expect(doc.html).toContain("مفكرة لحقوق الإنسان");
    expect(doc.html).not.toContain("<img");
    expect(doc.html).not.toContain("subscriber@example.com");
  });

  it("builds an admin notification without logo or subscriber email", () => {
    const doc = buildAdminNewSubscriberEmail({
      email: "person@example.com",
      subscribedAt: new Date("2026-11-18T14:17:00.000Z"),
    });
    expect(doc.subject).toBe(
      "New Newsletter Subscriber | Human Rights Agenda",
    );
    expect(doc.html).toContain("New Newsletter Subscription");
    expect(doc.html).toContain("Subscribed");
    expect(doc.html).not.toContain("<img");
    expect(doc.html).not.toContain("person@example.com");
    expect(doc.html).not.toContain("mailto:");
    expect(doc.html).not.toContain("agendahumanrights@gmail.com");
    expect(doc.text).toContain("Status: Subscribed");
    expect(doc.html).not.toContain("SMTP_APP_PASSWORD");
  });
});
