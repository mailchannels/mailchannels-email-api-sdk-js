/* Simplified internal native fetch utilities inspired by ofetch */
import { createFetchError } from "./fetch-error";
import type {
  MailChannelsFetchContext,
  MailChannelsFetchHttpMethod,
  MailChannelsFetchOptions,
  MailChannelsFetchRequest,
  MailChannelsFetchResponse,
  MailChannelsFetchResponseType
} from "../types/fetch";

const RETRY_STATUS_CODES = new Set([
  408, // Request Timeout
  409, // Conflict
  425, // Too Early (Experimental)
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504 // Gateway Timeout
]);

const PAYLOAD_METHODS = new Set<MailChannelsFetchHttpMethod>(["DELETE", "PATCH", "POST", "PUT"]);

const withBase = (path: string, base = "") => {
  if (!base) return path;
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
};

type QueryValue =
  | string
  | number
  | boolean
  | QueryValue[]
  | Record<string, unknown>
  | null
  | undefined;
type QueryObject = Record<string, QueryValue | QueryValue[]>;

const normalizeQueryValue = (value: QueryValue) => {
  if (value === null) return "";
  if (typeof value === "object") return JSON.stringify(value) ?? "";
  return String(value);
};

const withQuery = (input: string, query?: QueryObject) => {
  if (!query || Object.keys(query).length === 0) return input;

  const searchIndex = input.indexOf("?");
  if (searchIndex === -1) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      for (const item of Array.isArray(value) ? value : [value]) {
        searchParams.append(key, normalizeQueryValue(item));
      }
    }
    const queryString = searchParams.toString();
    return queryString ? `${input}?${queryString}` : input;
  }

  const searchParams = new URLSearchParams(input.slice(searchIndex + 1));
  const base = input.slice(0, searchIndex);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) searchParams.delete(key);
    else if (Array.isArray(value)) {
      for (const item of value) searchParams.append(key, normalizeQueryValue(item));
    }
    else searchParams.set(key, normalizeQueryValue(value));
  }

  const queryString = searchParams.toString();
  return queryString ? `${base}?${queryString}` : base;
};

const parseResponse = async (
  response: Response,
  responseType?: MailChannelsFetchResponseType
) => {
  if (responseType === "arrayBuffer") return response.arrayBuffer();

  const text = await response.text();
  if (responseType === "text") return text;
  if (!text) return undefined;

  const contentType = response.headers.get("content-type") || "";
  if (responseType === "json" || !contentType || /\bjson\b/i.test(contentType)) {
    return JSON.parse(text) as unknown;
  }
  return text;
};

const getRetryCount = <R extends MailChannelsFetchResponseType>(
  options: MailChannelsFetchOptions<R>,
  method: MailChannelsFetchHttpMethod
) => {
  if (typeof options.retry === "number") return options.retry;
  if (options.retry === false || PAYLOAD_METHODS.has(method)) return 0;
  return 1;
};

const abortSignalAny = (signals: AbortSignal[]): AbortSignal => {
  if (typeof AbortSignal.any === "function") return AbortSignal.any(signals);

  const controller = new AbortController();
  const signalList = Array.from(signals);

  for (const signal of signalList) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
  }

  const onAbort = (event: Event) => {
    const signal = event.target as AbortSignal;
    controller.abort(signal.reason);
    for (const s of signalList) {
      s.removeEventListener("abort", onAbort);
    }
  };

  for (const signal of signalList) {
    signal.addEventListener("abort", onAbort, { once: true });
  }
  return controller.signal;
};

const fetchAttempt = async <T, R extends MailChannelsFetchResponseType>(
  request: MailChannelsFetchRequest,
  options: MailChannelsFetchOptions<R>,
  method: MailChannelsFetchHttpMethod,
  retriesRemaining: number
) => {
  const headers = new Headers(options.headers);

  if (options.timeout) {
    const timeoutSignal = AbortSignal.timeout(options.timeout);
    options.signal = options.signal
      ? abortSignalAny([timeoutSignal, options.signal])
      : timeoutSignal;
  }

  const { body, ...reqOptions } = options;
  const init: RequestInit = { ...reqOptions, method, headers };

  if (body !== undefined && PAYLOAD_METHODS.has(method)) {
    init.body = JSON.stringify(body);
  }

  const errorOptions: Record<string, unknown> = { ...reqOptions, method, headers };
  delete errorOptions.query;
  if (body !== undefined) {
    errorOptions.body = PAYLOAD_METHODS.has(method) ? init.body : body;
  }

  let response: Response;
  try {
    response = await globalThis.fetch(request, init);
  }
  catch (e) {
    const error = e as Error;
    const isAbort = (error && error.name === "AbortError" && !options.timeout) || false;
    if (retriesRemaining > 0 && !isAbort) {
      return fetchAttempt<T, R>(request, options, method, retriesRemaining - 1);
    }

    throw createFetchError(request, method, errorOptions, undefined, error);
  }

  let fetchResponse: MailChannelsFetchResponse<T>;
  let shouldRetry = false;

  const data = await parseResponse(response, options.responseType);
  Object.defineProperty(response, "_data", { configurable: true, value: data });
  fetchResponse = response as MailChannelsFetchResponse<T>;
  const context: MailChannelsFetchContext<T> = { request, response: fetchResponse };
  await options.onResponse?.(context);

  if (response.status >= 400 && response.status < 600) {
    await options.onResponseError?.(context);
    shouldRetry = retriesRemaining > 0 && RETRY_STATUS_CODES.has(response.status);

    if (!shouldRetry) throw createFetchError(request, method, errorOptions, response);
  }

  if (shouldRetry) return fetchAttempt<T, R>(request, options, method, retriesRemaining - 1);
  return fetchResponse;
};

type MappedResponseType<R extends MailChannelsFetchResponseType, JsonType = unknown>
  = R extends "arrayBuffer" ? ArrayBuffer : R extends "text" ? string : JsonType;

export const $fetch = async <T = unknown, R extends MailChannelsFetchResponseType = "json">(
  path: string,
  options: MailChannelsFetchOptions<R> = {}
): Promise<MappedResponseType<R, T>> => {
  const method = options.method || "GET";
  const url = withQuery(withBase(path, options.baseURL), options.query);
  const retries = getRetryCount(options, method);
  const fetchOptions = { ...options };
  const response = await fetchAttempt<MappedResponseType<R, T>, R>(
    url,
    fetchOptions,
    method,
    retries
  );
  return response._data as MappedResponseType<R, T>;
};
