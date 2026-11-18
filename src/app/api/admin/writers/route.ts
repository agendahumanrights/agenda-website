import { assertSameOrigin, requireAdminSession } from "@/server/auth";
import { parseJsonBody, parseSearchParams } from "@/server/http/parse";
import { jsonCreated, jsonError, jsonOk } from "@/server/http/responses";
import {
  createWriter,
  listAdminWriters,
} from "@/server/services/writers";
import {
  adminWriterListQuerySchema,
  createWriterBodySchema,
} from "@/server/validations/writers";

export async function GET(request: Request) {
  try {
    await requireAdminSession();
    const url = new URL(request.url);
    const query = parseSearchParams(
      url.searchParams,
      adminWriterListQuerySchema,
    );
    const result = await listAdminWriters(query);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    assertSameOrigin(request);
    const body = await parseJsonBody(request, createWriterBodySchema);
    const writer = await createWriter(body);
    return jsonCreated({ writer });
  } catch (error) {
    return jsonError(error);
  }
}