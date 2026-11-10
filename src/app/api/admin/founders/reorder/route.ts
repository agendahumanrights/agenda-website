import { assertSameOrigin, requireAdminSession } from "@/server/auth";
import { parseJsonBody } from "@/server/http/parse";
import { jsonError, jsonOk } from "@/server/http/responses";
import { reorderFounders } from "@/server/services/founders";
import { reorderFoundersBodySchema } from "@/server/validations/founders";

/**
 * PUT — replace display order with a complete ordered founder ID list.
 * Partial/paginated subsets are rejected to avoid corrupting global order.
 */
export async function PUT(request: Request) {
  try {
    await requireAdminSession();
    assertSameOrigin(request);
    const body = await parseJsonBody(request, reorderFoundersBodySchema);
    await reorderFounders(body);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
