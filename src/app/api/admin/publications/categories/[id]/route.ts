import { assertSameOrigin, requireAdminSession } from "@/server/auth";
import { parseJsonBody } from "@/server/http/parse";
import { jsonError, jsonOk } from "@/server/http/responses";
import {
  deletePublicationCategory,
  getPublicationCategoryById,
  updatePublicationCategory,
} from "@/server/services/categories";
import { updatePublicationCategoryBodySchema } from "@/server/validations/categories";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const category = await getPublicationCategoryById(id);
    return jsonOk({ category });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdminSession();
    assertSameOrigin(request);
    const { id } = await params;
    const body = await parseJsonBody(
      request,
      updatePublicationCategoryBodySchema,
    );
    const category = await updatePublicationCategory(id, body);
    return jsonOk({ category });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await requireAdminSession();
    assertSameOrigin(request);
    const { id } = await params;
    await deletePublicationCategory(id);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
