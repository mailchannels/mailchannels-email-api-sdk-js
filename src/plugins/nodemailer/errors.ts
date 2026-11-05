import type { ErrorResponse, ErrorType } from "../../types/responses";

/**
 * Error passed to Nodemailer when the MailChannels Email API rejects a message.
 *
 * Follows Nodemailer's error shape (`code`, `responseCode`, `response`), so code written
 * for the SMTP transport can keep reading `error.responseCode`.
 */
export class MailChannelsTransportError extends Error {
  /** The SDK error type, e.g. `invalid_request_error`. */
  code: ErrorType;
  /** The HTTP status code from the API, or `null` if no HTTP response was received. */
  statusCode: number | null;
  /** The HTTP status code from the API, as on Nodemailer's SMTP errors. */
  declare responseCode?: number;
  /** The raw API response body as JSON text, as on Nodemailer's SMTP errors. */
  declare response?: string;
  /** The parsed API response body, or `null` if none is available. */
  apiResponse: Record<string, unknown> | null;

  constructor (error: ErrorResponse) {
    super(error.message);
    this.name = "MailChannelsTransportError";
    this.code = error.type;
    this.statusCode = error.statusCode;
    this.apiResponse = error.response;
    if (error.statusCode !== null) this.responseCode = error.statusCode;
    if (error.response) this.response = JSON.stringify(error.response);
  }
}
