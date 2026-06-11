import type { DataResponse } from "../responses";
import type { SubAccount } from "./create";

export interface SubAccountsListOptions {
  /**
   * Possible values are `1` to `1000`.
   * @default 1000
   */
  limit?: number;
  /**
   * The offset for pagination.
   * @default 0
   */
  offset?: number;
}

export type SubAccountsListResponse = DataResponse<SubAccount[]>;
