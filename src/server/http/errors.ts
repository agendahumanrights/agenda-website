export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function notImplemented(feature: string): AppError {
  return new AppError(
    501,
    "NOT_IMPLEMENTED",
    `${feature} is not implemented yet.`,
  );
}

export function unauthorized(message = "Unauthorized"): AppError {
  return new AppError(401, "UNAUTHORIZED", message);
}

export function forbidden(message = "Forbidden"): AppError {
  return new AppError(403, "FORBIDDEN", message);
}

export function notFound(message = "Not found"): AppError {
  return new AppError(404, "NOT_FOUND", message);
}

export function badRequest(message: string, details?: unknown): AppError {
  return new AppError(400, "BAD_REQUEST", message, details);
}

export function conflict(message: string, details?: unknown): AppError {
  return new AppError(409, "CONFLICT", message, details);
}

export function tooManyRequests(
  message = "Too many attempts. Try again later.",
  details?: unknown,
): AppError {
  return new AppError(429, "TOO_MANY_REQUESTS", message, details);
}

export function serviceUnavailable(
  message = "Service temporarily unavailable.",
  details?: unknown,
): AppError {
  return new AppError(503, "SERVICE_UNAVAILABLE", message, details);
}

export function payloadTooLarge(
  message = "Uploaded file is too large.",
  details?: unknown,
): AppError {
  return new AppError(413, "PAYLOAD_TOO_LARGE", message, details);
}

export function unsupportedMediaType(
  message = "Unsupported file type.",
  details?: unknown,
): AppError {
  return new AppError(415, "UNSUPPORTED_MEDIA_TYPE", message, details);
}
