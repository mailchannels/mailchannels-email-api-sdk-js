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
  click: number;
  clickTrackingDelivered: number;
  endTime: string;
  open: number;
  openTrackingDelivered: number;
  startTime: string;
  uniqueClick?: number;
  uniqueClickTrackingDelivered?: number;
  uniqueOpen?: number;
  uniqueOpenTrackingDelivered?: number;
}

export type MetricsEngagementResponse = DataResponse<MetricsEngagement>;
