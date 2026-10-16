import type { MetricsBucket } from "../../../types/metrics";

type MetricBuckets<T extends object> = {
  [Metric in keyof T]: readonly MetricsBucket[] | undefined;
};

type MetricsTimeSeriesRow = {
  periodStart: string;
  [metric: string]: number | string;
};

export const buildMetricsTimeSeries = <T extends object>(buckets: T & MetricBuckets<T>) => {
  const rows = new Map<string, MetricsTimeSeriesRow>();

  for (const metric of Object.keys(buckets) as Array<keyof T>) {
    const metricBuckets = buckets[metric];
    if (!metricBuckets) continue;

    for (const { periodStart, count } of metricBuckets) {
      const row = rows.get(periodStart) ?? { periodStart };
      row[String(metric)] = count;
      rows.set(periodStart, row);
    }
  }

  return [...rows.values()];
};
