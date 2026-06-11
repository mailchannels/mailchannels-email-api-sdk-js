import type { DataResponse } from "../responses";

export interface SubAccountsApiKey {
  /**
   * The API key ID for the sub-account.
   */
  id: number;
  /**
   * API key for the sub-account.
   */
  key: string;
}

export type SubAccountsApiKeysCreateResponse = DataResponse<SubAccountsApiKey>;

export interface SubAccountsApiKeysListOptions {
  /**
   * The maximum number of API keys included in the response. Possible values are `1` to `1000`.
   * @default 100
   */
  limit?: number;
  /**
   * Offset into the list of API keys to return.
   * @default 0
   */
  offset?: number;
}

export type SubAccountsApiKeysListResponse = DataResponse<SubAccountsApiKey[]>;

/** @deprecated Use `SubAccountsApiKeysCreateResponse` instead. */
export type SubAccountsCreateApiKeyResponse = SubAccountsApiKeysCreateResponse;

/** @deprecated Use `SubAccountsApiKeysListOptions` instead. */
export type SubAccountsListApiKeyOptions = SubAccountsApiKeysListOptions;

/** @deprecated Use `SubAccountsApiKeysListResponse` instead. */
export type SubAccountsListApiKeyResponse = SubAccountsApiKeysListResponse;
