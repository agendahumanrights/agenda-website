import { z } from "zod";

import { assertSameOrigin, requireAdminSession } from "@/server/auth";
import { parseJsonBody, parseWithSchema } from "@/server/http/parse";
import { jsonError, jsonOk } from "@/server/http/responses";
import {
  deleteFounder,
  getAdminFounderById,
  updateFounder,
} from "@/server/services/founders";
import { updateFounderBodySchema } from "@/server/validations/founders";

type RouteContext = { params: Promise<{ id: string }> };

const idSchema = z.object({ id: z.string().cuid() });

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
    const { id } = parseWithSchema(idSchema, await context.params);
    const founder = await getAdminFounderById(id);
    return jsonOk({ founder });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
    assertSameOrigin(request);
    const { id } = parseWithSchema(idSchema, await context.params);
    const body = await parseJsonBody(request, updateFounderBodySchema);
    const founder = await updateFounder(id, body);
    return jsonOk({ founder });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
    assertSameOrigin(request);
    const { id } = parseWithSchema(idSchema, await context.params);
    await deleteFounder(id);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
