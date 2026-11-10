import { assertSameOrigin, requireAdminSession } from "@/server/auth";
import { badRequest } from "@/server/http/errors";
import { jsonCreated, jsonError } from "@/server/http/responses";
import { parseWithSchema } from "@/server/http/parse";
import { uploadMediaAsset } from "@/server/services/media";
import { mediaUploadMetaSchema } from "@/server/validations/media";

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    assertSameOrigin(request);

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw badRequest("Missing file field.");
    }

    const purposeRaw = form.get("purpose");
    const altAr = String(form.get("altAr") ?? "");
    const altEn = String(form.get("altEn") ?? "");
    const meta = parseWithSchema(mediaUploadMetaSchema, {
      purpose: purposeRaw,
      altTexts: { ar: altAr, en: altEn },
    });

    const bytes = Buffer.from(await file.arrayBuffer());
    const asset = await uploadMediaAsset({
      purpose: meta.purpose,
      filename: file.name || "upload",
      bytes,
      altAr: meta.altTexts?.ar || undefined,
      altEn: meta.altTexts?.en || undefined,
    });

    return jsonCreated({ media: asset });
  } catch (error) {
    return jsonError(error);
  }
}
