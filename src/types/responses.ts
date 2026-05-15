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
