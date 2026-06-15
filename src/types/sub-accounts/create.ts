import type { DataResponse } from "../responses";

export interface SubAccount {
  /**
   * The name of the company associated with the sub-account.
   */
  companyName: string;
  /**
   * If the sub-account is enabled.
   */
  enabled: boolean;
  /**
   * The handle for the sub-account.
   */
  handle: string;
}

export type SubAccountsCreateResponse = DataResponse<SubAccount>;

/** @deprecated Use `SubAccount` instead. */
export type SubAccountsAccount = SubAccount;
