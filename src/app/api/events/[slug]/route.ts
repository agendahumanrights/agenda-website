import { getRequestLocale } from "@/i18n/get-locale";
import { parseWithSchema } from "@/server/http/parse";
import { jsonError, jsonOk } from "@/server/http/responses";
import { getPublishedEventBySlug } from "@/server/services/events";
import { publicEventBySlugSchema } from "@/server/validations/events";
import { localeSchema } from "@/server/validations/common";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const { searchParams } = new URL(request.url);
    const cookieLocale = await getRequestLocale();
    const locale = parseWithSchema(
      localeSchema,
      searchParams.get("locale") ?? cookieLocale,
    );
    parseWithSchema(publicEventBySlugSchema, { locale, slug });
    const event = await getPublishedEventBySlug(locale, slug);
    return jsonOk(event);
  } catch (error) {
    return jsonError(error);
  }
}
