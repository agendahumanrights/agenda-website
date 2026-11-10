import { assertSameOrigin, requireAdminSession } from "@/server/auth";
import { parseJsonBody, parseSearchParams } from "@/server/http/parse";
import { jsonCreated, jsonError, jsonOk } from "@/server/http/responses";
import { getRequestLocale } from "@/i18n/get-locale";
import {
  createPublicationCategory,
  listAdminPublicationCategories,
  listPublicationCategories,
} from "@/server/services/categories";
import {
  adminPublicationCategoryListQuerySchema,
  createPublicationCategoryBodySchema,
} from "@/server/validations/categories";

export async function GET(request: Request) {
  try {
    await requireAdminSession();
    const url = new URL(request.url);
    if (url.searchParams.get("options") === "1") {
      const locale = await getRequestLocale();
      const items = await listPublicationCategories(locale);
      return jsonOk({ items });
    }
    const query = parseSearchParams(
      url.searchParams,
      adminPublicationCategoryListQuerySchema,
    );
    const result = await listAdminPublicationCategories(query);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    assertSameOrigin(request);
    const body = await parseJsonBody(
      request,
      createPublicationCategoryBodySchema,
    );
    const category = await createPublicationCategory(body);
    return jsonCreated({ category });
  } catch (error) {
    return jsonError(error);
  }
}
