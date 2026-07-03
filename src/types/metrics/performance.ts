import type { DataResponse } from "../responses";
import type { MetricsBucket } from ".";

export interface MetricsPerformance {
  /**
   * Count of messages hard-bounced during the specified time range.
   */
  bounced: number;
  /**
   * Count of messages complained during the specified time range.
   */
  complained: number;
  /**
   * A series of metrics aggregations bucketed by time interval (e.g. hour, day).
   */
  buckets: {
    bounced: MetricsBucket[];
    complained: MetricsBucket[];
    delivered: MetricsBucket[];
    processed: MetricsBucket[];
  };
  /**
   * Count of messages delivered during the specified time range.
   */
  delivered: number;
  /**
   * The end of the time range for retrieving message performance metrics (exclusive).
   */
  endTime: string;
  /**
   * Count of messages processed during the specified time range.
   */
  processed: number;
  /**
   * The beginning of the time range for retrieving message performance metrics (inclusive).
   */
  startTime: string;
}

export type MetricsPerformanceResponse = DataResponse<MetricsPerformance>;
