import type { DataResponse } from "../responses";

export interface SubAccountsUsage {
  /**
   * The end date of the current billing period (ISO 8601 format).
   * @example "2025-04-11"
   */
  endDate?: string;
  /**
   * The start date of the current billing period (ISO 8601 format).
   * @example "2025-03-12"
   */
  startDate?: string;
  /**
   * The total usage for the current billing period.
   * @example 5000
   */
  total: number;
  /**
   * The effective monthly limit for the current billing period. A limit of zero means the account cannot send any messages.
   * For sub-accounts with no explicit limit set (i.e., -1), the monthly limit for the parent account is returned.
   * @example 10000
   */
  monthlyLimit: number;
}

export type SubAccountsUsageResponse = DataResponse<SubAccountsUsage>;
