import { $fetch, type FetchOptions } from "ofetch";
import type { MailChannelsClientOptions } from "./types/client";
import { version } from "../package.json";

export class MailChannelsClient {
  private static readonly DEFAULT_BASE_URL = "https://api.mailchannels.net";
  private readonly options: MailChannelsClientOptions;
  #headers: Record<string, string>;

  constructor (key: string, options: MailChannelsClientOptions = {}) {
    if (!key) {
      throw new Error("Missing MailChannels API key.");
    }

    this.options = {
      baseUrl: options.baseUrl || MailChannelsClient.DEFAULT_BASE_URL,
      retry: options.retry ?? false
    };

    this.#headers = {
      "X-API-Key": key,
      "Accept": "application/json",
      "Content-Type": "application/json",
      "User-Agent": `mailchannels-node/${version}`
    };
  }

  protected async _fetch<T>(path: string, options?: FetchOptions<"json">) {
    return $fetch<T>(path, {
      baseURL: this.options.baseUrl,
      retry: this.options.retry,
      ...options,
      headers: {
        ...this.#headers,
        ...options?.headers
      }
    });
  }

  async post<T>(path: string, options?: Omit<FetchOptions<"json">, "method">) {
    return this._fetch<T>(path, { method: "POST", ...options });
  }

  async get<T>(path: string, options?: Omit<FetchOptions<"json">, "method">) {
    return this._fetch<T>(path, { method: "GET", ...options });
  }

  async delete<T>(path: string, options?: Omit<FetchOptions<"json">, "method">) {
    return this._fetch<T>(path, { method: "DELETE", ...options });
  }

  async put<T>(path: string, options?: Omit<FetchOptions<"json">, "method">) {
    return this._fetch<T>(path, { method: "PUT", ...options });
  }

  async patch<T>(path: string, options?: Omit<FetchOptions<"json">, "method">) {
    return this._fetch<T>(path, { method: "PATCH", ...options });
  }
}
