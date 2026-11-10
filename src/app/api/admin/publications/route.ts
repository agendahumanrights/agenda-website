import { assertSameOrigin, requireAdminSession } from "@/server/auth";
import { parseJsonBody, parseSearchParams } from "@/server/http/parse";
import { jsonCreated, jsonError, jsonOk } from "@/server/http/responses";
import {
  createPublication,
  listAdminPublications,
} from "@/server/services/publications";
import {
  adminPublicationListQuerySchema,
  createPublicationBodySchema,
} from "@/server/validations/publications";

export async function GET(request: Request) {
  try {
    await requireAdminSession();
    const url = new URL(request.url);
    const query = parseSearchParams(
      url.searchParams,
      adminPublicationListQuerySchema,
    );
    const result = await listAdminPublications(query);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    assertSameOrigin(request);
    const body = await parseJsonBody(request, createPublicationBodySchema);
    const publication = await createPublication(body);
    return jsonCreated({ publication });
  } catch (error) {
    return jsonError(error);
  }
}
