import { assertSameOrigin, requireAdminSession } from "@/server/auth";
import { getRequestLocale } from "@/i18n/get-locale";
import { parseJsonBody } from "@/server/http/parse";
import { jsonError, jsonOk } from "@/server/http/responses";
import {
  getAdminHomepageSelectionState,
  patchHomepageSelection,
} from "@/server/services/homepage";
import { homepageSelectionPatchSchema } from "@/server/validations/homepage";

/**
 * GET — featured publications + events selection state.
 * PUT — patch selection; omitted sections are preserved.
 *   Accepts `{ featuredPublications }`, `{ featuredEvents }`,
 *   or back-compat `{ publicationIds }` / `{ eventIds }`.
 */
export async function GET() {
  try {
    await requireAdminSession();
    const locale = await getRequestLocale();
    const state = await getAdminHomepageSelectionState(locale);
    return jsonOk(state);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdminSession();
    assertSameOrigin(request);
    const body = await parseJsonBody(request, homepageSelectionPatchSchema);
    await patchHomepageSelection(body);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
