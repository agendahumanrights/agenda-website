import { getRequestLocale } from "@/i18n/get-locale";
import { parseSearchParams } from "@/server/http/parse";
import { jsonError, jsonOk, jsonNotImplemented } from "@/server/http/responses";
import { listPublishedEvents } from "@/server/services/events";
import { publicEventListQuerySchema } from "@/server/validations/events";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (!searchParams.has("locale")) {
      searchParams.set("locale", await getRequestLocale());
    }
    const query = parseSearchParams(searchParams, publicEventListQuerySchema);
    const result = await listPublishedEvents(query);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST() {
  return jsonNotImplemented("Public event create");
}
