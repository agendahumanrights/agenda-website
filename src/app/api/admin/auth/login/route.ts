import { assertSameOrigin } from "@/server/auth/csrf";
import { loginAdministrator } from "@/server/auth/login";
import { parseJsonBody } from "@/server/http/parse";
import { jsonError, jsonOk } from "@/server/http/responses";
import { loginBodySchema } from "@/server/validations/auth";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await parseJsonBody(request, loginBodySchema);
    const result = await loginAdministrator(body, request);
    return jsonOk({
      admin: {
        id: result.admin.userId,
        email: result.admin.email,
        name: result.admin.name,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
