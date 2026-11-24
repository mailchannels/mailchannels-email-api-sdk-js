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

const abortSignalAny = (signals: AbortSignal[]): { signal: AbortSignal, cleanup?: () => void } => {
  if (typeof AbortSignal.any === "function") return { signal: AbortSignal.any(signals) };

  // Remove fallback and cleanup once all runtimes support AbortSignal.any() (Node.js >= 20.3.0)
  const controller = new AbortController();
  const signalList = Array.from(signals);

  for (const signal of signalList) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return { signal: controller.signal };
    }
  }

  const onAbort = (event: Event) => {
    const signal = event.target as AbortSignal;
    controller.abort(signal.reason);
    cleanup();
  };

  const cleanup = () => {
    for (const s of signalList) {
      s.removeEventListener("abort", onAbort);
    }
  };

  for (const signal of signalList) {
    signal.addEventListener("abort", onAbort, { once: true });
  }
  return { signal: controller.signal, cleanup };
};

const fetchAttempt = async <T, R extends MailChannelsFetchResponseType>(
  request: MailChannelsFetchRequest,
  options: MailChannelsFetchOptions<R>,
  method: MailChannelsFetchHttpMethod,
  retriesRemaining: number
) => {
  const headers = new Headers(options.headers);
  const { body, ...reqOptions } = options;
  const init: RequestInit = { ...reqOptions, method, headers };

  if (body !== undefined && PAYLOAD_METHODS.has(method)) {
    init.body = JSON.stringify(body);
  }

  const timeoutSignal = options.timeout ? AbortSignal.timeout(options.timeout) : undefined;
  let cleanup: VoidFunction | undefined;
  if (timeoutSignal) {
    const combined = options.signal ? abortSignalAny([timeoutSignal, options.signal]) : undefined;
    init.signal = combined?.signal ?? timeoutSignal;
    cleanup = combined?.cleanup;
  }

  const errorOptions: Record<string, unknown> = { ...init };
  delete errorOptions.query;
  if (body !== undefined) {
    errorOptions.body = PAYLOAD_METHODS.has(method) ? init.body : body;
  }

  let response: Response | undefined;
  let data: unknown;
  try {
    options.signal?.throwIfAborted();
    response = await globalThis.fetch(request, init);
    data = await parseResponse(response, options.responseType);
  }
  catch (e) {
    cleanup?.();
    const error = e as Error;
    const isAbort = options.signal?.aborted || (error?.name === "AbortError" && !options.timeout);
    const timedOut = timeoutSignal?.aborted;
    const retryable = timedOut
      ? options.retryOnTimeout && (!response || RETRY_STATUS_CODES.has(response.status))
      : !response;
    if (retriesRemaining > 0 && !isAbort && retryable) {
      return fetchAttempt<T, R>(request, options, method, retriesRemaining - 1);
    }

    if (response) throw e;
    throw createFetchError(request, method, errorOptions, undefined, error);
  }

  cleanup?.();
  Object.defineProperty(response, "_data", { configurable: true, value: data });
  const fetchResponse = response as MailChannelsFetchResponse<T>;
  const context: MailChannelsFetchContext<T> = { request, response: fetchResponse };
  await options.onResponse?.(context);

  if (response.status >= 400 && response.status < 600) {
    if (retriesRemaining > 0 && RETRY_STATUS_CODES.has(response.status)) {
      return fetchAttempt<T, R>(request, options, method, retriesRemaining - 1);
    }

    await options.onResponseError?.(context);
    throw createFetchError(request, method, errorOptions, response);
  }

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
