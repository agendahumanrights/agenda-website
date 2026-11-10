"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/i18n/dictionaries";

type Props = {
  labels: Dictionary["admin"];
};

export function LogoutButton({ labels }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onLogout() {
    if (pending) return;
    startTransition(async () => {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      router.push("/admin/login");
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending}
      onClick={onLogout}
    >
      {pending ? labels.loggingOut : labels.logout}
    </Button>
  );
}
