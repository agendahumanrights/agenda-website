import { assertSameOrigin } from "@/server/auth/csrf";
import { logoutAdministrator } from "@/server/auth/logout";
import { jsonError, jsonOk } from "@/server/http/responses";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await logoutAdministrator();
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
