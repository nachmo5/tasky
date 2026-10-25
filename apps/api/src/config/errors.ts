export const HTTP_STATUS_CODES = {
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  RATE_LIMIT: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

type HttpStatusCode = (typeof HTTP_STATUS_CODES)[keyof typeof HTTP_STATUS_CODES];

export class HTTPError extends Error {
  statusCode: HttpStatusCode = HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
}

export class HTTPNotFoundError extends HTTPError {
  override statusCode: HttpStatusCode = HTTP_STATUS_CODES.NOT_FOUND;
}

export class HTTPBadRequestError extends HTTPError {
  override statusCode: HttpStatusCode = HTTP_STATUS_CODES.BAD_REQUEST;
}

export class HTTPInternalServerError extends HTTPError {
  override statusCode: HttpStatusCode = HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
}

export class HTTPUnauthorizedError extends HTTPError {
  override statusCode: HttpStatusCode = HTTP_STATUS_CODES.UNAUTHORIZED;
}

export class HTTPRateLimitError extends HTTPError {
  override statusCode: HttpStatusCode = HTTP_STATUS_CODES.RATE_LIMIT;
}

export function asError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  const message =
    error && typeof error === "object" && "message" in error ? (error as { message: string }).message : String(error);
  return new Error(message);
}
