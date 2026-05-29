import { describe, expect, it } from "vitest";
import type { FetchResponse } from "ofetch";
import { ErrorCode, getStatusError, validatePagination } from "~/utils/errors";

describe("getStatusError", () => {
  type ErrorResponse = FetchResponse<{ message?: string, errors?: string[] } | string>;
  it("should return default error message", () => {
    const response = { status: ErrorCode.InternalServerError };
    const error = getStatusError(response as ErrorResponse);
    expect(error).toStrictEqual({
      message: "Unknown error.",
      statusCode: ErrorCode.InternalServerError,
      type: "internal_server_error"
    });
  });

  it("should return custom error message", () => {
    const response = { status: ErrorCode.NotFound };
    const error = getStatusError(response as ErrorResponse, {
      [ErrorCode.NotFound]: "Custom not found error."
    });
    expect(error).toStrictEqual({
      message: "Custom not found error.",
      statusCode: ErrorCode.NotFound,
      type: "not_found"
    });
  });

  it("should return unauthorized code error type", () => {
    const response = { status: ErrorCode.Unauthorized };
    const error = getStatusError(response as ErrorResponse);
    expect(error).toStrictEqual({
      message: "Unknown error.",
      statusCode: ErrorCode.Unauthorized,
      type: "authentication_error"
    });
  });

  it("should return payload too large error type", () => {
    const response = { status: ErrorCode.PayloadTooLarge };
    const error = getStatusError(response as ErrorResponse);
    expect(error).toStrictEqual({
      message: "Unknown error.",
      statusCode: ErrorCode.PayloadTooLarge,
      type: "payload_too_large_error"
    });
  });

  it("should return unprocessable entity error type", () => {
    const response = { status: ErrorCode.UnprocessableEntity };
    const error = getStatusError(response as ErrorResponse);
    expect(error).toStrictEqual({
      message: "Unknown error.",
      statusCode: ErrorCode.UnprocessableEntity,
      type: "unprocessable_entity_error"
    });
  });

  it("should return too many requests error type", () => {
    const response = { status: ErrorCode.TooManyRequests };
    const error = getStatusError(response as ErrorResponse);
    expect(error).toStrictEqual({
      message: "Unknown error.",
      statusCode: ErrorCode.TooManyRequests,
      type: "rate_limit_error"
    });
  });

  it("should return error message from response string", () => {
    const response = { _data: "Server is down" };
    const error = getStatusError(response as ErrorResponse);
    expect(error).toBeTruthy();
  });

  it("should return error message from response object", () => {
    const response = { _data: { message: "Invalid request" } };
    const error = getStatusError(response as ErrorResponse);
    expect(error).toBeTruthy();
  });

  it("should return error message from response array", () => {
    const response = { _data: { errors: ["Invalid email", "Name is required"] } };
    const error = getStatusError(response as ErrorResponse);
    expect(error).toBeTruthy();
  });
});

describe("validatePagination", () => {
  it("should return error for invalid limit without max", () => {
    const error = validatePagination({ limit: 0 });
    expect(error).toBeTruthy();
  });
});
