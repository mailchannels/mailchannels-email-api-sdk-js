import type { DataResponse } from "../responses";

export type WebhooksListResponse = DataResponse<{
  /**
   * A customer's webhook that events will be sent to
   */
  webhook: string;
  /**
   * The number of consecutive failed deliveries to this webhook before a failure alert is
   * triggered.
   *
   * No value means failure alerts are disabled for this webhook.
   * A value of `1` means an alert is triggered on every failure.
   */
  failureThreshold?: number | null;
}[]>;
