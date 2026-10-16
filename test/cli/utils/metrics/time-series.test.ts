import { describe, expect, it } from "vitest";
import { buildMetricsTimeSeries } from "~/cli/utils/metrics/time-series";

describe("buildMetricsTimeSeries", () => {
  it("merges metric counts for each period", () => {
    expect(buildMetricsTimeSeries({
      delivered: [
        { count: 1, periodStart: "2026-01-01T00:00:00Z" },
        { count: 2, periodStart: "2026-01-02T00:00:00Z" }
      ],
      processed: [
        { count: 3, periodStart: "2026-01-01T00:00:00Z" },
        { count: 4, periodStart: "2026-01-03T00:00:00Z" }
      ]
    })).toStrictEqual([
      {
        periodStart: "2026-01-01T00:00:00Z",
        delivered: 1,
        processed: 3
      },
      {
        periodStart: "2026-01-02T00:00:00Z",
        delivered: 2
      },
      {
        periodStart: "2026-01-03T00:00:00Z",
        processed: 4
      }
    ]);
  });

  it("returns no rows when all metric buckets are empty or missing", () => {
    expect(buildMetricsTimeSeries({
      delivered: [],
      processed: undefined
    })).toStrictEqual([]);
  });
});
