import { assertSameOrigin, requireAdminSession } from "@/server/auth";
import { parseJsonBody, parseSearchParams } from "@/server/http/parse";
import { jsonCreated, jsonError, jsonOk } from "@/server/http/responses";
import { getRequestLocale } from "@/i18n/get-locale";
import {
  createFounder,
  listAdminFounders,
  listAllAdminFoundersOrdered,
} from "@/server/services/founders";
import {
  adminFounderListQuerySchema,
  createFounderBodySchema,
} from "@/server/validations/founders";

export async function GET(request: Request) {
  try {
    await requireAdminSession();
    const url = new URL(request.url);
    if (url.searchParams.get("forOrder") === "1") {
      const locale = await getRequestLocale();
      const items = await listAllAdminFoundersOrdered(locale);
      return jsonOk({ items });
    }
    const query = parseSearchParams(
      url.searchParams,
      adminFounderListQuerySchema,
    );
    const result = await listAdminFounders(query);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    assertSameOrigin(request);
    const body = await parseJsonBody(request, createFounderBodySchema);
    const founder = await createFounder(body);
    return jsonCreated({ founder });
  } catch (error) {
    return jsonError(error);
  }
}
