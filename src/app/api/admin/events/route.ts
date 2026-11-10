import { assertSameOrigin, requireAdminSession } from "@/server/auth";
import { parseJsonBody, parseSearchParams } from "@/server/http/parse";
import { jsonCreated, jsonError, jsonOk } from "@/server/http/responses";
import { createEvent, listAdminEvents } from "@/server/services/events";
import {
  adminEventListQuerySchema,
  createEventBodySchema,
} from "@/server/validations/events";

export async function GET(request: Request) {
  try {
    await requireAdminSession();
    const url = new URL(request.url);
    const query = parseSearchParams(url.searchParams, adminEventListQuerySchema);
    const result = await listAdminEvents(query);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    assertSameOrigin(request);
    const body = await parseJsonBody(request, createEventBodySchema);
    const event = await createEvent(body);
    return jsonCreated({ event });
  } catch (error) {
    return jsonError(error);
  }
}
