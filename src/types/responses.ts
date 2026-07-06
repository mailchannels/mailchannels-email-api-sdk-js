export type ErrorType =
  | "invalid_request_error"
  | "authentication_error"
  | "permission_error"
  | "not_found"
  | "conflict_error"
  | "payload_too_large_error"
  | "unprocessable_entity_error"
  | "rate_limit_error"
  | "internal_server_error"
  | "validation_error"
  | "application_error"
  | "api_error";

export interface ErrorResponse {
  /**
   * A human-readable description of the error.
   */
  message: string;
  /**
   * The HTTP status code from the API, or `null` if the error is not related to an HTTP request.
   *
   * This field is intended for diagnostic use only and should not be relied upon.
   */
  statusCode: number | null;
  /**
   * A string identifier for the type of error.
   *
   * This field is intended for diagnostic use only and should not be relied upon.
   */
  type: ErrorType;
  /**
   * An object containing the response, if available.
   * This field may be `null` if no response is available or if the error is not related to an HTTP request or if the response is not a JSON object.
   */
  response: Record<string, unknown> | null;
}

export interface SuccessResponse {
  /**
   * Whether the operation was successful.
   */
  success: boolean;
  /**
   * Error information if the operation failed.
   */
  error: ErrorResponse | null;
}

export type DataResponse<T> = {
  /**
   * The response data.
   */
  data: T;
  /**
   * Error information if the operation failed.
   */
  error: null;
} | {
  /**
   * The response data.
   */
  data: null;
  /**
   * Error information if the operation failed.
   */
  error: ErrorResponse;
};
