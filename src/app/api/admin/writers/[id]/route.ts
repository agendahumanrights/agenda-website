import { z } from "zod";

import { assertSameOrigin, requireAdminSession } from "@/server/auth";
import { parseJsonBody, parseWithSchema } from "@/server/http/parse";
import { jsonError, jsonOk } from "@/server/http/responses";
import {
  deleteWriter,
  getAdminWriterById,
  updateWriter,
} from "@/server/services/writers";
import { updateWriterBodySchema } from "@/server/validations/writers";

type RouteContext = { params: Promise<{ id: string }> };

const idSchema = z.object({ id: z.string().cuid() });

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
    const { id } = parseWithSchema(idSchema, await context.params);
    const writer = await getAdminWriterById(id);
    return jsonOk({ writer });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
    assertSameOrigin(request);
    const { id } = parseWithSchema(idSchema, await context.params);
    const body = await parseJsonBody(request, updateWriterBodySchema);
    const writer = await updateWriter(id, body);
    return jsonOk({ writer });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
    assertSameOrigin(request);
    const { id } = parseWithSchema(idSchema, await context.params);
    await deleteWriter(id);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}