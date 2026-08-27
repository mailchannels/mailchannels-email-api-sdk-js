import { describe, expect, it } from "vitest";
import type { FetchResponse } from "ofetch";
import { ErrorCode, getStatusError, validateCustomTrackingName, validatePagination } from "~/internal/errors";

describe("getStatusError", () => {
  type ErrorResponse = FetchResponse<{ message?: string, errors?: string[] } | string | Record<string, unknown>>;
  it("should return default error message", () => {
    const response = { status: ErrorCode.InternalServerError };
    const error = getStatusError(response as ErrorResponse);
    expect(error).toStrictEqual({
      message: "Unknown error.",
      statusCode: ErrorCode.InternalServerError,
      type: "internal_server_error",
      response: null
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
      type: "not_found",
      response: null
    });
  });

  it("should return unauthorized code error type", () => {
    const response = { status: ErrorCode.Unauthorized };
    const error = getStatusError(response as ErrorResponse);
    expect(error).toStrictEqual({
      message: "Authorization required.",
      statusCode: ErrorCode.Unauthorized,
      type: "authentication_error",
      response: null
    });
  });

  it("should return payload too large error type", () => {
    const response = { status: ErrorCode.PayloadTooLarge };
    const error = getStatusError(response as ErrorResponse);
    expect(error).toStrictEqual({
      message: "Unknown error.",
      statusCode: ErrorCode.PayloadTooLarge,
      type: "payload_too_large_error",
      response: null
    });
  });

  it("should return unprocessable entity error type", () => {
    const response = { status: ErrorCode.UnprocessableEntity };
    const error = getStatusError(response as ErrorResponse);
    expect(error).toStrictEqual({
      message: "Unknown error.",
      statusCode: ErrorCode.UnprocessableEntity,
      type: "unprocessable_entity_error",
      response: null
    });
  });

  it("should return too many requests error type", () => {
    const response = { status: ErrorCode.TooManyRequests };
    const error = getStatusError(response as ErrorResponse);
    expect(error).toStrictEqual({
      message: "Unknown error.",
      statusCode: ErrorCode.TooManyRequests,
      type: "rate_limit_error",
      response: null
    });
  });

  it("should return error message from response string", () => {
    const response = { _data: "Server is down" };
    const error = getStatusError(response as ErrorResponse);
    expect(error).toStrictEqual({
      message: "Unknown error. Server is down",
      statusCode: null,
      type: "api_error",
      response: null
    });
  });

  it("should return error message from response object", () => {
    const response = { _data: { message: "Invalid request" } };
    const error = getStatusError(response as ErrorResponse);
    expect(error).toStrictEqual({
      message: "Unknown error. Invalid request",
      statusCode: null,
      type: "api_error",
      response: { message: "Invalid request" }
    });
  });

  it("should return error message from response array", () => {
    const response = { _data: { errors: ["Invalid email", "Name is required"] } };
    const error = getStatusError(response as ErrorResponse);
    expect(error).toStrictEqual({
      message: "Unknown error. Invalid email, Name is required",
      statusCode: null,
      type: "api_error",
      response: { errors: ["Invalid email", "Name is required"] }
    });
  });

  it("should return error response from data object with unknown structure", () => {
    const response = { _data: { unknown: "data" } };
    const error = getStatusError(response as unknown as ErrorResponse);
    expect(error).toStrictEqual({
      message: "Unknown error.",
      statusCode: null,
      type: "api_error",
      response: { unknown: "data" }
    });
  });
});

describe("validatePagination", () => {
  it("should return error for invalid limit without max", () => {
    const error = validatePagination({ limit: 0 });
    expect(error).toStrictEqual({
      message: "The limit value is invalid. Only positive values are allowed.",
      statusCode: null,
      type: "validation_error",
      response: null
    });
  });
});

describe("validateCustomTrackingName", () => {
  it("should return error for invalid custom tracking domain name", () => {
    const error = validateCustomTrackingName("invalid name");
    expect(error).toStrictEqual({
      message: "The custom tracking domain name must match ^[a-z0-9-]+$",
      statusCode: null,
      type: "validation_error",
      response: null
    });
  });

  it("should return error for long custom tracking domain name", () => {
    const longName = "a".repeat(65);
    const error = validateCustomTrackingName(longName);
    expect(error).toStrictEqual({
      message: "The custom tracking domain name must be between 1 and 64 characters.",
      statusCode: null,
      type: "validation_error",
      response: null
    });
  });
});
