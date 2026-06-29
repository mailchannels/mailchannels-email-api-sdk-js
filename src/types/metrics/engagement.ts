import type { DataResponse } from "../responses";
import type { MetricsBucket } from ".";

export interface MetricsEngagement {
  /**
   * A series of metrics aggregations bucketed by time interval (e.g. hour, day).
   */
  buckets: {
    click: MetricsBucket[];
    clickTrackingDelivered: MetricsBucket[];
    open: MetricsBucket[];
    openTrackingDelivered: MetricsBucket[];
    uniqueClick?: MetricsBucket[];
    uniqueClickTrackingDelivered?: MetricsBucket[];
    uniqueOpen?: MetricsBucket[];
    uniqueOpenTrackingDelivered?: MetricsBucket[];
  };
  /**
   * Count of click events by recipients.
   */
  click: number;
  /**
   * Count of recipients of delivered messages with HTML content that contains tracked click URLs, where click tracking is enabled in the send request.
   */
  clickTrackingDelivered: number;
  /**
   * The end of the time range for retrieving message engagement metrics (exclusive).
   */
  endTime: string;
  /**
   * Count of open events by recipients.
   */
  open: number;
  /**
   * Count of recipients of delivered messages with HTML content where open tracking was enabled in the send request.
   */
  openTrackingDelivered: number;
  /**
   * The beginning of the time range for retrieving message engagement metrics (inclusive).
   */
  startTime: string;
  /**
   * Count of distinct messages that had at least one click event.
   * Unlike `click`, each message is counted at most once regardless of how many links were clicked or how many times.
   * Use this to compute click rates without exceeding 100%.
   */
  uniqueClick?: number;
  /**
   * Count of distinct messages delivered with click tracking enabled (message-level, not recipient-level).
   * Use as the denominator when computing unique click rates.
   */
  uniqueClickTrackingDelivered?: number;
  /**
   * Count of distinct messages that had at least one open event.
   * Unlike `open`, each message is counted at most once regardless of how many times its tracking pixel was fired.
   * Use this to compute open rates without exceeding 100%.
   */
  uniqueOpen?: number;
  /**
   * Count of distinct messages delivered with open tracking enabled (message-level, not recipient-level).
   * Use as the denominator when computing unique open rates.
   */
  uniqueOpenTrackingDelivered?: number;
}

export type MetricsEngagementResponse = DataResponse<MetricsEngagement>;
