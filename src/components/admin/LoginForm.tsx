"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { sitePath } from "@/i18n/pathnames";
import type { Dictionary } from "@/i18n/dictionaries";
import { safeAdminNextPath } from "@/lib/admin-redirect";

type Props = {
  labels: Dictionary["admin"];
  nextPath: string;
};

export function LoginForm({ labels, nextPath }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function mapError(status: number, code?: string): string {
    if (status === 429 || code === "TOO_MANY_REQUESTS") return labels.throttled;
    if (status === 503 || code === "SERVICE_UNAVAILABLE") {
      return labels.serviceUnavailable;
    }
    if (status === 403 || code === "FORBIDDEN") return labels.originRejected;
    if (status === 400 || code === "BAD_REQUEST") return labels.validationError;
    return labels.invalidCredentials;
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "same-origin",
        });
        const data = (await res.json().catch(() => null)) as {
          error?: { code?: string; message?: string };
        } | null;

        if (!res.ok) {
          setError(mapError(res.status, data?.error?.code));
          return;
        }

        router.push(safeAdminNextPath(nextPath));
        router.refresh();
      } catch {
        setError(labels.serviceUnavailable);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-4">
      <FormField id="admin-email" label={labels.email}>
        <Input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending}
        />
      </FormField>

      <FormField id="admin-password" label={labels.password}>
        <div className="flex gap-2">
          <Input
            id="admin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
            className="flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
          >
            {showPassword ? labels.hidePassword : labels.showPassword}
          </Button>
        </div>
      </FormField>

      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? labels.signingIn : labels.submitLogin}
      </Button>

      <Link
        href={sitePath("/")}
        className="text-sm font-medium underline-offset-2 hover:underline"
      >
        {labels.backToSite}
      </Link>
    </form>
  );
}
