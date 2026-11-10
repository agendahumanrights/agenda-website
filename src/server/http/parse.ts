import { ZodError, type ZodType } from "zod";

import { badRequest } from "@/server/http/errors";

export function parseWithSchema<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw badRequest("Validation failed", formatZodError(result.error));
  }
  return result.data;
}

export function formatZodError(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw badRequest("Invalid JSON body");
  }
  return parseWithSchema(schema, body);
}

export function parseSearchParams<T>(
  searchParams: URLSearchParams,
  schema: ZodType<T>,
): T {
  const raw = Object.fromEntries(searchParams.entries());
  return parseWithSchema(schema, raw);
}
