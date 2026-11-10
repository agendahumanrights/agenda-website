import "server-only";

import { normalizeEmail, verifyPassword } from "@/server/auth/password";
import {
  assertNotThrottled,
  clearLoginFailures,
  emailThrottleKey,
  ipThrottleKey,
  recordLoginFailure,
  resolveClientIp,
} from "@/server/auth/throttle";
import {
  createAdminSession,
  setSessionCookie,
} from "@/server/auth/session";
import {
  INVALID_CREDENTIALS_MESSAGE,
  type AdminSession,
} from "@/server/auth/types";
import { getPrisma, isDatabaseConfigured } from "@/server/db";
import { unauthorized, serviceUnavailable } from "@/server/http/errors";

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResult = {
  admin: AdminSession;
};

export async function loginAdministrator(
  input: LoginInput,
  request: Request,
): Promise<LoginResult> {
  if (!isDatabaseConfigured()) {
    throw serviceUnavailable("Authentication is temporarily unavailable.");
  }

  const email = normalizeEmail(input.email);
  const password = input.password;
  const ip = resolveClientIp(request);
  const keys = [
    emailThrottleKey(email),
    ...(ip ? [ipThrottleKey(ip)] : []),
  ];

  await assertNotThrottled(keys);

  const prisma = getPrisma();
  const user = await prisma.adminUser.findUnique({ where: { email } });

  // Always run a verify to reduce timing differences between unknown/wrong password.
  const hashToCheck =
    user?.passwordHash ??
    "$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const passwordOk = await verifyPassword(hashToCheck, password);

  if (!user || !passwordOk) {
    await recordLoginFailure(keys);
    throw unauthorized(INVALID_CREDENTIALS_MESSAGE);
  }

  await clearLoginFailures(keys);

  const { token } = await createAdminSession(user.id);
  await setSessionCookie(token);

  return {
    admin: {
      userId: user.id,
      email: user.email,
      name: user.name,
    },
  };
}
