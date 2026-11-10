import { assertSameOrigin, requireAdminSession } from "@/server/auth";
import { parseJsonBody, parseWithSchema } from "@/server/http/parse";
import { jsonError, jsonOk } from "@/server/http/responses";
import {
  deletePublication,
  getAdminPublicationById,
  updatePublication,
} from "@/server/services/publications";
import { updatePublicationBodySchema } from "@/server/validations/publications";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const idSchema = z.object({ id: z.string().cuid() });

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
    const { id } = parseWithSchema(idSchema, await context.params);
    const publication = await getAdminPublicationById(id);
    return jsonOk({ publication });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
    assertSameOrigin(request);
    const { id } = parseWithSchema(idSchema, await context.params);
    const body = await parseJsonBody(request, updatePublicationBodySchema);
    const publication = await updatePublication(id, body);
    return jsonOk({ publication });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
    assertSameOrigin(request);
    const { id } = parseWithSchema(idSchema, await context.params);
    await deletePublication(id);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
