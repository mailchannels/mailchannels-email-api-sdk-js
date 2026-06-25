import type { DataResponse } from "../responses";
import type { DomainsCustomTrackingDomain, DomainsCustomTrackingScope } from "./custom-tracking-create";

export interface DomainsCustomTrackingListOptions {
  /**
   * Filter by custom tracking domain label.
   */
  name?: string;
  /**
   * Filter by status.
   */
  status?: "active" | "disabled";
  /**
   * Filter by scope.
   */
  scope?: DomainsCustomTrackingScope;
  /**
   * The maximum number of domains to return. Possible values are `1` to `1000`.
   * @default 100
   */
  limit?: number;
  /**
   * The number of domains to skip before returning results. The default is `0`.
   * @default 0
   */
  offset?: number;
}

export type DomainsCustomTrackingListResponse = DataResponse<{
  /**
   * List of custom tracking domains matching the filter criteria.
   */
  customTrackingDomains: DomainsCustomTrackingDomain[];
  /**
   * Total number of custom tracking domains.
   */
  total: number;
}>;
