import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { $fetch } from "~/internal/fetch";
import type { MailChannelsFetchResponse } from "~/types/fetch";

const fake = {
  baseURL: "https://api.example.test/v1/",
  path: "/emails",
  headers: { "Accept": "application/json", "Content-Type": "application/json" },
  body: { to: "person@example.com", subject: "Hello" },
  response: { id: "email-123", status: "queued" }
};

const jsonResponse = (data: unknown, status = 200): Response => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json" }
});

const fetchMock = vi.fn<typeof fetch>();
type FetchErrorShape<T = unknown> = Error & {
  request?: string;
  options?: unknown;
  response?: MailChannelsFetchResponse<T>;
  data?: T;
  status?: number;
  statusCode?: number;
  statusText?: string;
  statusMessage?: string;
};

describe("fetch adapter", () => {
  beforeEach(() => {
    fetchMock.mockReset().mockImplementation(async () => jsonResponse(fake.response));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("joins API paths to the base URL and merges scalar query values", async () => {
    const data = await $fetch<typeof fake.response>(fake.path, {
      baseURL: fake.baseURL,
      headers: fake.headers,
      query: { "keep": 1, "replace": "new value", "remove": undefined, "dry-run": false }
    });

    const requestURL = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(data).toEqual(fake.response);
    expect(requestURL.pathname).toBe("/v1/emails");
    expect([...requestURL.searchParams.entries()]).toEqual([
      ["keep", "1"],
      ["replace", "new value"],
      ["dry-run", "false"]
    ]);
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toEqual(new Headers(fake.headers));
  });

  it("adds query parameters to paths without an existing query string", async () => {
    await $fetch(fake.path, { baseURL: fake.baseURL, query: { id: "key-1" } });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.example.test/v1/emails?id=key-1");
  });

  it("normalizes array, null, and object query values", async () => {
    await $fetch(fake.path, {
      baseURL: fake.baseURL,
      query: {
        tag: ["first", "second"],
        empty: null,
        filter: { status: "queued" },
        omitted: { toJSON: () => undefined }
      }
    });

    const requestURL = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestURL.searchParams.getAll("tag")).toEqual(["first", "second"]);
    expect(requestURL.searchParams.get("empty")).toBe("");
    expect(requestURL.searchParams.get("filter")).toBe("{\"status\":\"queued\"}");
    expect(requestURL.searchParams.get("omitted")).toBe("");
  });

  it("merges scalar and array query values into an existing query string", async () => {
    await $fetch(`${fake.path}?replace=old&tag=existing`, {
      baseURL: fake.baseURL,
      query: { replace: "new", tag: ["first", "second"] }
    });

    const requestURL = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect([...requestURL.searchParams.entries()]).toEqual([
      ["replace", "new"],
      ["tag", "existing"],
      ["tag", "first"],
      ["tag", "second"]
    ]);
  });

  it("leaves URLs unchanged for absent or empty query options", async () => {
    await $fetch(fake.path, { baseURL: fake.baseURL });
    await $fetch(fake.path, { baseURL: fake.baseURL, query: {} });
    await $fetch(fake.path, { baseURL: fake.baseURL, query: { skipped: undefined } });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.example.test/v1/emails");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("https://api.example.test/v1/emails");
    expect(fetchMock.mock.calls[2]?.[0]).toBe("https://api.example.test/v1/emails");
  });

  it("removes an existing query when its replacement value is undefined", async () => {
    await $fetch(`${fake.path}?remove=old`, {
      baseURL: fake.baseURL,
      query: { remove: undefined }
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.example.test/v1/emails");
  });

  it("keeps a relative path when no base URL is provided", async () => {
    await $fetch(fake.path);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(fake.path);
  });

  it("serializes SDK JSON bodies and omits bodies for GET requests", async () => {
    await $fetch(fake.path, {
      baseURL: fake.baseURL,
      method: "POST",
      headers: fake.headers,
      body: fake.body
    });
    await $fetch(fake.path, { baseURL: fake.baseURL, method: "GET", body: fake.body });

    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify(fake.body));
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toEqual(new Headers(fake.headers));
    expect(fetchMock.mock.calls[1]?.[1]?.body).toBeUndefined();
  });

  it("forwards native request options", async () => {
    await $fetch(fake.path, {
      baseURL: fake.baseURL,
      method: "POST",
      cache: "no-store",
      credentials: "include",
      redirect: "manual"
    });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.body).toBeUndefined();
    expect(init?.cache).toBe("no-store");
    expect(init?.credentials).toBe("include");
    expect(init?.redirect).toBe("manual");
  });

  it("passes through the caller signal and combines it with a timeout", async () => {
    const controller = new AbortController();
    await $fetch(fake.path, { baseURL: fake.baseURL, signal: controller.signal });
    await $fetch(fake.path, { baseURL: fake.baseURL, timeout: 10000 });
    await $fetch(fake.path, { baseURL: fake.baseURL, timeout: 10000, signal: controller.signal });
    await $fetch(fake.path, { baseURL: fake.baseURL, timeout: 0 });

    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(controller.signal);
    expect(fetchMock.mock.calls[1]?.[1]?.signal).toBeInstanceOf(AbortSignal);
    const combinedSignal = fetchMock.mock.calls[2]?.[1]?.signal;
    expect(combinedSignal).toBeInstanceOf(AbortSignal);
    expect(combinedSignal).not.toBe(controller.signal);
    expect(fetchMock.mock.calls[3]?.[1]?.signal).toBeUndefined();
  });

  it("uses native AbortSignal.any when available", async () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(AbortSignal, "any");
    const controller = new AbortController();
    const combinedSignal = new AbortController().signal;
    const nativeAny = vi.fn((_signals: AbortSignal[]) => combinedSignal);
    Object.defineProperty(AbortSignal, "any", { configurable: true, value: nativeAny });

    try {
      await $fetch(fake.path, {
        baseURL: fake.baseURL,
        signal: controller.signal,
        timeout: 10000
      });

      expect(nativeAny).toHaveBeenCalledWith([expect.any(AbortSignal), controller.signal]);
      expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(combinedSignal);
    }
    finally {
      if (originalDescriptor) Object.defineProperty(AbortSignal, "any", originalDescriptor);
      else Reflect.deleteProperty(AbortSignal, "any");
    }
  });

  it("combines the caller signal and timeout", async () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(AbortSignal, "any");
    Object.defineProperty(AbortSignal, "any", { configurable: true, value: undefined });

    const controller = new AbortController();
    fetchMock.mockImplementationOnce((_input, init) => new Promise((_resolve, reject) => {
      const signal = init?.signal;
      signal?.addEventListener("abort", () => reject(signal.reason), { once: true });
    })).mockImplementationOnce((_input, init) => Promise.reject(init?.signal?.reason));

    try {
      const result = $fetch(fake.path, {
        baseURL: fake.baseURL,
        signal: controller.signal,
        timeout: 10000
      });
      controller.abort(new Error("caller cancelled"));

      await expect(result).rejects.toThrow("caller cancelled");
      expect(fetchMock).toHaveBeenCalledTimes(2);
    }
    finally {
      if (originalDescriptor) Object.defineProperty(AbortSignal, "any", originalDescriptor);
      else Reflect.deleteProperty(AbortSignal, "any");
    }
  });

  it("carries the composed timeout signal into retries", async () => {
    const controller = new AbortController();
    const options = {
      baseURL: fake.baseURL,
      retry: 1,
      signal: controller.signal,
      timeout: 10000
    };
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ message: "try again" }, 503))
      .mockResolvedValueOnce(jsonResponse(fake.response));

    await expect($fetch(fake.path, options)).resolves.toEqual(fake.response);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstSignal = fetchMock.mock.calls[0]?.[1]?.signal;
    const secondSignal = fetchMock.mock.calls[1]?.[1]?.signal;
    expect(firstSignal).not.toBe(controller.signal);
    expect(secondSignal).not.toBe(firstSignal);
    expect(options.signal).toBe(controller.signal);
  });

  it("retries timed out requests with the inherited aborted signal", async () => {
    const signalAbortedAtStart: boolean[] = [];
    fetchMock.mockImplementation(async (_input, init) => new Promise((_resolve, reject) => {
      const signal = init?.signal;
      if (!signal) return;
      signalAbortedAtStart.push(signal.aborted);
      if (signal.aborted) reject(signal.reason);
      else signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    }));

    await expect($fetch(fake.path, {
      baseURL: fake.baseURL,
      timeout: 1,
      retry: 2
    })).rejects.toThrow("The operation was aborted due to timeout");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(signalAbortedAtStart).toEqual([false, true, true]);
  });

  it("runs the response hook with parsed data", async () => {
    const onResponse = vi.fn();
    await $fetch(fake.path, { baseURL: fake.baseURL, onResponse });
    expect(onResponse.mock.calls[0]?.[0].response._data).toEqual(fake.response);
  });

  it("returns undefined for empty responses", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    expect(await $fetch(fake.path, { baseURL: fake.baseURL })).toBeUndefined();

    fetchMock.mockResolvedValueOnce(new Response(""));
    expect(await $fetch(fake.path, { baseURL: fake.baseURL })).toBeUndefined();
  });

  it("parses JSON and returns non-JSON responses as text", async () => {
    const responseWithoutContentType = new Response(JSON.stringify(fake.response));
    responseWithoutContentType.headers.delete("content-type");
    fetchMock.mockResolvedValueOnce(responseWithoutContentType);
    expect(await $fetch(fake.path, { baseURL: fake.baseURL })).toEqual(fake.response);

    fetchMock.mockResolvedValueOnce(new Response("plain response", {
      headers: { "content-type": "text/plain" }
    }));
    expect(await $fetch<string>(fake.path, { baseURL: fake.baseURL })).toBe("plain response");
  });

  it("supports explicit text and arrayBuffer responses", async () => {
    fetchMock.mockResolvedValueOnce(new Response("plain response"));
    const text: string = await $fetch(fake.path, { responseType: "text" });
    expect(text).toBe("plain response");

    fetchMock.mockResolvedValueOnce(new Response(""));
    expect(await $fetch(fake.path, { responseType: "text" })).toBe("");

    fetchMock.mockResolvedValueOnce(new Response(new Uint8Array([0, 1, 2])));
    const arrayBuffer: ArrayBuffer = await $fetch(fake.path, { responseType: "arrayBuffer" });
    expect(Array.from(new Uint8Array(arrayBuffer))).toEqual([0, 1, 2]);
  });

  it("does not retry invalid JSON parsing", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{invalid", {
      headers: { "content-type": "application/json" }
    }));
    await expect($fetch(fake.path, {
      baseURL: fake.baseURL,
      retry: 2
    })).rejects.toThrow(SyntaxError);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("calls hooks for API errors with the parsed payload", async () => {
    const onResponse = vi.fn();
    const onResponseError = vi.fn();
    fetchMock.mockResolvedValueOnce(jsonResponse({ errors: ["invalid recipient"] }, 400));

    await expect($fetch(fake.path, {
      baseURL: fake.baseURL,
      onResponse,
      onResponseError
    })).rejects.toThrow("400");
    expect(onResponse.mock.calls[0]?.[0].response.status).toBe(400);
    expect(onResponseError.mock.calls[0]?.[0].response._data).toEqual({
      errors: ["invalid recipient"]
    });
  });

  it("throws a FetchError with response metadata for API errors", async () => {
    const payload = { message: "invalid recipient" };
    fetchMock.mockResolvedValueOnce(jsonResponse(payload, 400));

    let caught: unknown;
    try {
      await $fetch(fake.path, { baseURL: fake.baseURL, retry: false });
    }
    catch (error) {
      caught = error;
    }

    const error = caught as FetchErrorShape<typeof payload>;
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("FetchError");
    expect(error.message).toContain("400");
    expect(error.request).toBe("https://api.example.test/v1/emails");
    expect(error.options).toBeDefined();
    expect(error.response?.status).toBe(400);
    expect(error.response?._data).toEqual(payload);
    expect(error.data).toEqual(payload);
    expect(error.status).toBe(400);
    expect(error.statusCode).toBe(400);
    expect(error.statusText).toBe(error.response?.statusText);
    expect(error.statusMessage).toBe(error.response?.statusText);
  });

  it("does not run response hooks when an error response has invalid JSON", async () => {
    const onResponse = vi.fn();
    const onResponseError = vi.fn();
    const body = "{invalid";
    fetchMock.mockResolvedValueOnce(new Response(body, {
      status: 400,
      headers: { "content-type": "application/json" }
    }));

    await expect($fetch(fake.path, {
      baseURL: fake.baseURL,
      onResponse,
      onResponseError
    })).rejects.toThrow(SyntaxError);
    expect(onResponse).not.toHaveBeenCalled();
    expect(onResponseError).not.toHaveBeenCalled();
  });

  it("retries retryable API statuses", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ message: "try again" }, 503))
      .mockResolvedValueOnce(jsonResponse(fake.response));

    expect(await $fetch(fake.path, {
      baseURL: fake.baseURL,
      method: "POST",
      retry: 1
    })).toEqual(fake.response);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a non-retryable API status", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "invalid" }, 501));
    await expect($fetch(fake.path, { baseURL: fake.baseURL, retry: 2 })).rejects.toThrow("501");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("retries HTTP failures before honoring an abort on the caller signal", async () => {
    const controller = new AbortController();
    const abortError = new DOMException("caller cancelled", "AbortError");
    const onResponseError = vi.fn(() => controller.abort(abortError));
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ message: "unavailable" }, 503))
      .mockImplementationOnce((_input, init) => Promise.reject(init?.signal?.reason));

    await expect($fetch(fake.path, {
      baseURL: fake.baseURL,
      retry: 1,
      signal: controller.signal,
      onResponseError
    })).rejects.toThrow("caller cancelled");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries network failures by default for GET", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("connection reset"))
      .mockResolvedValueOnce(jsonResponse(fake.response));

    expect(await $fetch(fake.path, { baseURL: fake.baseURL })).toEqual(fake.response);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry POST by default or requests with retry disabled", async () => {
    fetchMock.mockRejectedValueOnce(new Error("connection reset"));
    await expect($fetch(fake.path, {
      baseURL: fake.baseURL,
      method: "POST"
    })).rejects.toThrow("connection reset");
    expect(fetchMock).toHaveBeenCalledOnce();

    fetchMock.mockRejectedValueOnce(new Error("connection reset"));
    await expect($fetch(fake.path, {
      baseURL: fake.baseURL,
      retry: false
    })).rejects.toThrow("connection reset");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("stops network retries at the configured count", async () => {
    fetchMock.mockRejectedValue("network down");
    await expect($fetch(fake.path, {
      baseURL: fake.baseURL,
      retry: 1
    })).rejects.toThrow("network down");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry rejected requests when the caller signal is aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    fetchMock.mockRejectedValueOnce(controller.signal.reason);

    await expect($fetch(fake.path, {
      baseURL: fake.baseURL,
      retry: 2,
      signal: controller.signal
    })).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
