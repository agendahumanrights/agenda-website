import { getRequestLocale } from "@/i18n/get-locale";
import { parseWithSchema } from "@/server/http/parse";
import { jsonError, jsonOk } from "@/server/http/responses";
import { getPublishedPublicationBySlug } from "@/server/services/publications";
import { publicPublicationBySlugSchema } from "@/server/validations/publications";
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
    parseWithSchema(publicPublicationBySlugSchema, { locale, slug });
    const publication = await getPublishedPublicationBySlug(locale, slug);
    return jsonOk(publication);
  } catch (error) {
    return jsonError(error);
  }
}
