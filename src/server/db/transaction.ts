import "server-only";

import type { Prisma } from "@/generated/prisma";

import { getPrisma } from "@/server/db/client";

/**
 * Interactive transactions over a remote pooler (Supabase) often exceed Prisma's
 * default 5s timeout when several round-trips run inside the callback.
 * Admin mutations use this helper so create/update/delete stay reliable.
 */
export const INTERACTIVE_TX_OPTIONS = {
  maxWait: 10_000,
  timeout: 30_000,
} as const;

export function withInteractiveTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return getPrisma().$transaction(fn, INTERACTIVE_TX_OPTIONS);
}
