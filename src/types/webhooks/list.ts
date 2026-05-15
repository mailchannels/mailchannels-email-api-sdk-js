import type { DataResponse } from "../responses";

export type WebhooksListResponse = DataResponse<{
  /**
   * A customer's webhook that events will be sent to
   */
  webhook: string;
}[]>;
