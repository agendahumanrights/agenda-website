import { requireAdminSession } from "@/server/auth";
import { parseSearchParams } from "@/server/http/parse";
import { jsonError, jsonOk } from "@/server/http/responses";
import { listAdminNewsletterSubscribers } from "@/server/services/newsletter";
import { adminNewsletterListQuerySchema } from "@/server/validations/newsletter";

export async function GET(request: Request) {
  try {
    await requireAdminSession();
    const url = new URL(request.url);
    const query = parseSearchParams(
      url.searchParams,
      adminNewsletterListQuerySchema,
    );
    const result = await listAdminNewsletterSubscribers(query);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
