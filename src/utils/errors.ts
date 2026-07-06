import type { FetchResponse } from "ofetch";
import type { ErrorResponse, ErrorType } from "../types/responses";

export const enum ErrorCode {
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  Conflict = 409,
  PayloadTooLarge = 413,
  UnprocessableEntity = 422,
  TooManyRequests = 429,
  InternalServerError = 500
}

const STATUS_ERROR_TYPE_MAP: Record<number, ErrorType> = {
  [ErrorCode.BadRequest]: "invalid_request_error",
  [ErrorCode.Unauthorized]: "authentication_error",
  [ErrorCode.Forbidden]: "permission_error",
  [ErrorCode.NotFound]: "not_found",
  [ErrorCode.Conflict]: "conflict_error",
  [ErrorCode.PayloadTooLarge]: "payload_too_large_error",
  [ErrorCode.UnprocessableEntity]: "unprocessable_entity_error",
  [ErrorCode.TooManyRequests]: "rate_limit_error",
  [ErrorCode.InternalServerError]: "internal_server_error"
};

/** Create a standardized error response object. */
const createError = (
  message: string,
  statusCode: number | null = null,
  type: ErrorType,
  response: Record<string, unknown> | null = null
): ErrorResponse => {
  return {
    message,
    statusCode,
    type,
    response
  };
};

type MailChannelsErrorResponse = { message?: string, errors?: string[] } | string | Record<string, unknown>;

/** Create an error response based on the HTTP response status code and payload. */
export const getStatusError = (
  response: FetchResponse<MailChannelsErrorResponse>,
  errors: Record<number, string> = {}
) => {
  const statusText = errors[response.status] || "Unknown error.";

  const payload = response._data ?? (response as { data?: MailChannelsErrorResponse }).data;

  let details: string | undefined;
  let errorResponse: Record<string, unknown> | null = null;

  if (typeof payload === "string") {
    details = payload;
  }
  else if (typeof payload === "object" && payload !== null) {
    if (typeof payload.message === "string") {
      details = payload.message;
    }
    else if (Array.isArray(payload.errors) && payload.errors.length) {
      details = payload.errors.join(", ");
    }
    errorResponse = payload;
  }

  return createError(
    details ? `${statusText} ${details}` : statusText,
    response.status ?? null,
    STATUS_ERROR_TYPE_MAP[response.status] || "api_error",
    errorResponse
  );
};

/** Extract error message from exceptions. */
export const getResultError = (e: unknown, fallback: string) => {
  return createError(
    e instanceof Error ? e.message : fallback,
    null,
    "application_error"
  );
};

/** Create an error response with `validation_error` type. */
export const createValidationError = (message: string): ErrorResponse => {
  return createError(message, null, "validation_error");
};

/** Validate pagination parameters and return an error response if invalid. */
export const validatePagination = (pagination: Partial<{
  limit: number;
  max: number;
  offset: number;
}> = {}) => {
  const { limit, offset, max } = pagination;
  if (typeof limit === "number" && (limit < 1 || (max && limit > max))) {
    return createValidationError("The limit value " + (max ? `must be between 1 and ${max}.` : "is invalid. Only positive values are allowed."));
  }
  if (typeof offset === "number" && offset < 0) {
    return createValidationError("Offset must be greater than or equal to 0.");
  }
  return null;
};
