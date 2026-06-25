import type { DataResponse } from "../responses";
import type { DomainsCustomTrackingWithDnsSetupRequired } from "./custom-tracking-create";

export interface DomainsCustomTrackingUpdateOptions {
  /**
   * New label for this custom tracking domain. Maximum length is `64` characters. Must match the pattern `^[a-z0-9-]+$`.
   */
  name?: string;
  /**
   * New status. Re-activation requires DNS verification — add the TXT record and CNAME record described in the response body, then retry.
   */
  status?: "active" | "disabled";
}

export type DomainsCustomTrackingUpdateResponse = DataResponse<DomainsCustomTrackingWithDnsSetupRequired>;
