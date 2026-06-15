import type { DataResponse } from "../responses";

export interface SubAccountsLimit {
  sends: number;
}

export interface SubAccountsLimitsSetOptions extends SubAccountsLimit {}

export type SubAccountsLimitsGetResponse = DataResponse<SubAccountsLimit>;

/** @deprecated Use `SubAccountsLimitsGetResponse` instead. */
export type SubAccountsLimitResponse = SubAccountsLimitsGetResponse;
