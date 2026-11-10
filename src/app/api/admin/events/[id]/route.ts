import { z } from "zod";

import { assertSameOrigin, requireAdminSession } from "@/server/auth";
import { parseJsonBody, parseWithSchema } from "@/server/http/parse";
import { jsonError, jsonOk } from "@/server/http/responses";
import {
  deleteEvent,
  getAdminEventById,
  updateEvent,
} from "@/server/services/events";
import { updateEventBodySchema } from "@/server/validations/events";

type RouteContext = { params: Promise<{ id: string }> };

const idSchema = z.object({ id: z.string().cuid() });

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
    const { id } = parseWithSchema(idSchema, await context.params);
    const event = await getAdminEventById(id);
    return jsonOk({ event });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
    assertSameOrigin(request);
    const { id } = parseWithSchema(idSchema, await context.params);
    const body = await parseJsonBody(request, updateEventBodySchema);
    const event = await updateEvent(id, body);
    return jsonOk({ event });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireAdminSession();
    assertSameOrigin(request);
    const { id } = parseWithSchema(idSchema, await context.params);
    await deleteEvent(id);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
