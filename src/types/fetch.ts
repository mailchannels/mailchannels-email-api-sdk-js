// oxlint-disable typescript/no-explicit-any
export type MailChannelsFetchHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type MailChannelsFetchRequest = RequestInfo;
export interface MailChannelsFetchResponse<T> extends Response {
  _data?: T;
}
export interface MailChannelsFetchContext<T = any> {
  request: MailChannelsFetchRequest;
  response: MailChannelsFetchResponse<T>;
}

type MailChannelsFetchResponseHook = (context: MailChannelsFetchContext) => void | Promise<void>;

export type MailChannelsFetchResponseType = "json" | "arrayBuffer" | "text";

export interface MailChannelsFetchOptions<R extends MailChannelsFetchResponseType = "json">
  extends Omit<RequestInit, "body"> {
  method?: MailChannelsFetchHttpMethod;
  body?: Record<string, any>;
  baseURL?: string;
  query?: Record<string, any>;
  retry?: number | false;
  timeout?: number;
  responseType?: R;
  onResponse?: MailChannelsFetchResponseHook;
  onResponseError?: MailChannelsFetchResponseHook;
}
