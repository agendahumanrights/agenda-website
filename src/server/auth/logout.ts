import "server-only";

import { revokeCurrentSession } from "@/server/auth/session";

export async function logoutAdministrator(): Promise<void> {
  await revokeCurrentSession();
}
