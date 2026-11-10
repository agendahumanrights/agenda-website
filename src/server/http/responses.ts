import { NextResponse } from "next/server";

import type { ApiErrorBody } from "@/types/api";
import { AppError } from "@/server/http/errors";

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, { status: 200, ...init });
}

export function jsonCreated<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 });
}

export function jsonError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    const body: ApiErrorBody = {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
    return NextResponse.json(body, { status: error.status });
  }

  console.error(error);
  const body: ApiErrorBody = {
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred.",
    },
  };
  return NextResponse.json(body, { status: 500 });
}

export function jsonNotImplemented(feature: string): NextResponse {
  const body: ApiErrorBody = {
    error: {
      code: "NOT_IMPLEMENTED",
      message: `${feature} is not implemented yet.`,
    },
  };
  return NextResponse.json(body, { status: 501 });
}
