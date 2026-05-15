import { describe, expect, it } from "vitest";
import type { FetchResponse } from "ofetch";
import { getStatusError, validatePagination } from "~/utils/errors";

describe("getStatusError", () => {
  type ErrorResponse = FetchResponse<{ message?: string, errors?: string[] } | string>;
  it("should return default error message", () => {
    const response = { status: 500 };
    const error = getStatusError(response as ErrorResponse);
    expect(error).toStrictEqual({ message: "Unknown error.", statusCode: 500 });
  });

  it("should return custom error message", () => {
    const response = { status: 404 };
    const error = getStatusError(response as ErrorResponse, {
      404: "Custom not found error."
    });
    expect(error).toStrictEqual({ message: "Custom not found error.", statusCode: 404 });
  });

  it("should return error message from response string", () => {
    const response = { _data: "Server is down" };
    const error = getStatusError(response as ErrorResponse);
    expect(error).toStrictEqual({ message: "Unknown error. Server is down", statusCode: null });
  });

  it("should return error message from response object", () => {
    const response = { _data: { message: "Invalid request" } };
    const error = getStatusError(response as ErrorResponse);
    expect(error).toStrictEqual({ message: "Unknown error. Invalid request", statusCode: null });
  });

  it("should return error message from response array", () => {
    const response = { _data: { errors: ["Invalid email", "Name is required"] } };
    const error = getStatusError(response as ErrorResponse);
    expect(error).toStrictEqual({ message: "Unknown error. Invalid email, Name is required", statusCode: null });
  });
});

describe("validatePagination", () => {
  it("should return error for invalid limit without max", () => {
    const error = validatePagination({ limit: 0 });
    expect(error).toStrictEqual({ message: "The limit value is invalid. Only positive values are allowed.", statusCode: null });
  });
});
