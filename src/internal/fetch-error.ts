import type {
  MailChannelsFetchHttpMethod,
  MailChannelsFetchRequest,
  MailChannelsFetchResponse
} from "../types/fetch";

interface FetchErrorContext {
  request: MailChannelsFetchRequest;
  options: unknown;
  response?: Response;
  cause?: unknown;
}

class FetchError extends Error {
  declare request: MailChannelsFetchRequest;
  declare options: unknown;
  declare response?: Response;
  declare data?: unknown;
  declare status?: number;
  declare statusCode?: number;
  declare statusText?: string;
  declare statusMessage?: string;

  constructor (message: string, context: FetchErrorContext) {
    super(message, context.cause === undefined ? undefined : { cause: context.cause });
    this.name = "FetchError";

    Object.defineProperties(this, {
      request: { get: () => context.request },
      options: { get: () => context.options },
      response: { get: () => context.response },
      data: {
        get: () => (context.response as MailChannelsFetchResponse<unknown> | undefined)?._data
      },
      status: { get: () => context.response?.status },
      statusCode: { get: () => context.response?.status },
      statusText: { get: () => context.response?.statusText },
      statusMessage: { get: () => context.response?.statusText }
    });
  }
}

export const createFetchError = (
  request: MailChannelsFetchRequest,
  method: MailChannelsFetchHttpMethod,
  options: unknown,
  response?: Response,
  cause?: unknown
): Error => {
  const message = cause === null || cause === undefined
    ? ""
    : typeof cause === "object" && "message" in cause && cause.message
      ? String(cause.message)
      : String(cause);
  const status = response ? `${response.status} ${response.statusText}` : "<no response>";
  const errorMessage = `[${method}] ${JSON.stringify(request)}: ${status}${message ? ` ${message}` : ""}`;
  return new FetchError(errorMessage, { request, options, response, cause });
};
