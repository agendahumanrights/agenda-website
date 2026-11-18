"use client";

import { useId, useState, type FormEvent } from "react";

import { cn } from "@/lib/utils";

export type NewsletterSubscribeLabels = {
  title: string;
  description: string;
  emailPlaceholder: string;
  subscribe: string;
  subscribing: string;
  consent: string;
  success: string;
  invalidEmail: string;
  alreadySubscribed: string;
  error: string;
  honeypotLabel: string;
};

type Props = {
  labels: NewsletterSubscribeLabels;
  /** Public UI locale — selects welcome email language. */
  locale: "ar" | "en";
  className?: string;
};

type Feedback =
  | { kind: "success"; message: string }
  | { kind: "info"; message: string }
  | { kind: "error"; message: string }
  | null;

function isValidEmailShape(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function NewsletterSubscribeForm({
  labels,
  locale,
  className,
}: Props) {
  const formId = useId();
  const statusId = `${formId}-status`;
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;

    const trimmed = email.trim();
    if (!trimmed || !isValidEmailShape(trimmed)) {
      setFeedback({ kind: "error", message: labels.invalidEmail });
      return;
    }

    setPending(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: trimmed,
          locale,
          website: honeypot,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        outcome?: "subscribed" | "already_subscribed";
        error?: { code?: string; message?: string };
      } | null;

      if (res.status === 429) {
        setFeedback({
          kind: "error",
          message: data?.error?.message || labels.error,
        });
        return;
      }

      if (!res.ok) {
        if (res.status === 400) {
          setFeedback({ kind: "error", message: labels.invalidEmail });
          return;
        }
        setFeedback({ kind: "error", message: labels.error });
        return;
      }

      if (data?.outcome === "already_subscribed") {
        setFeedback({ kind: "info", message: labels.alreadySubscribed });
        return;
      }

      setEmail("");
      setFeedback({ kind: "success", message: labels.success });
    } catch {
      setFeedback({ kind: "error", message: labels.error });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-white sm:text-[0.95rem]">
          {labels.title}
        </h2>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-white/80 text-pretty">
          {labels.description}
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-md flex-col gap-2"
        noValidate
      >
        {/* Honeypot — visually hidden, not display:none so some bots still fill it */}
        <div
          className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
          aria-hidden="true"
        >
          <label htmlFor={`${formId}-website`}>{labels.honeypotLabel}</label>
          <input
            id={`${formId}-website`}
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch">
          <label className="sr-only" htmlFor={`${formId}-email`}>
            {labels.emailPlaceholder}
          </label>
          <input
            id={`${formId}-email`}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            dir="ltr"
            disabled={pending}
            value={email}
            placeholder={labels.emailPlaceholder}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={feedback?.kind === "error" ? true : undefined}
            aria-describedby={feedback ? statusId : undefined}
            className={cn(
              "min-h-11 w-full flex-1 rounded-lg border border-white/25 bg-white px-3 text-sm text-zinc-900 shadow-sm",
              "placeholder:text-zinc-400",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
              "disabled:opacity-70",
            )}
          />
          <button
            type="submit"
            disabled={pending}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-[var(--brand-blue)]",
              "transition hover:bg-white/90",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
              "disabled:cursor-not-allowed disabled:opacity-70",
              "sm:min-w-[7.5rem]",
            )}
          >
            {pending ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="size-3.5 animate-spin rounded-full border-2 border-[var(--brand-blue)]/30 border-t-[var(--brand-blue)]"
                  aria-hidden
                />
                {labels.subscribing}
              </span>
            ) : (
              labels.subscribe
            )}
          </button>
        </div>

        <p className="text-xs leading-relaxed text-white/65">{labels.consent}</p>

        <div
          id={statusId}
          role="status"
          aria-live="polite"
          className="min-h-[1.25rem]"
        >
          {feedback ? (
            <p
              className={cn(
                "text-sm",
                feedback.kind === "success" && "text-emerald-200",
                feedback.kind === "info" && "text-white/85",
                feedback.kind === "error" && "text-red-200",
              )}
            >
              {feedback.message}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
