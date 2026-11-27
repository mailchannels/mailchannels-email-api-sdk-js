export interface WebhooksCreateOptions {
  /**
   * The number of consecutive failed deliveries to this webhook before a failure alert is triggered.
   *
   * Must be 1 or greater to enable failure alerts.
   * If omitted, `null`, or `0`, no failure threshold is set for the webhook.
   */
  failureThreshold?: number | null;
}
