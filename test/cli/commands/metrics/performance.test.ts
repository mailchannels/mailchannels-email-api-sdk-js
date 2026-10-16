import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import performance from "~/cli/commands/metrics/performance";
import { tabulatedSections } from "~/cli/utils/shared/sections";
import { toWordsKeys } from "~/cli/utils/shared/style";
import { buildMetricsTimeSeries } from "~/cli/utils/metrics/time-series";
import type { MetricsPerformanceResponse } from "~/types/metrics/performance";

const fake = {
  args: [
    "--api-key", "test-api-key",
    "--start-time", "2026-09-30",
    "--end-time", "2026-10-30",
    "--campaign-id", "campaign-123",
    "--interval", "day"
  ],
  options: {
    startTime: "2026-09-30",
    endTime: "2026-10-30",
    campaignId: "campaign-123",
    interval: "day"
  },
  response: {
    data: {
      bounced: 1,
      complained: 2,
      buckets: {
        bounced: [{ count: 1, periodStart: "2026-10-13T00:00:00Z" }],
        complained: [{ count: 1, periodStart: "2026-10-13T00:00:00Z" }],
        delivered: [{ count: 1, periodStart: "2026-10-13T00:00:00Z" }],
        processed: [{ count: 1, periodStart: "2026-10-13T00:00:00Z" }]
      },
      delivered: 1,
      endTime: "2026-10-30T00:00:00Z",
      processed: 1,
      startTime: "2026-09-30T00:00:00Z"
    },
    error: null
  } satisfies MetricsPerformanceResponse
};

const mockPerformance = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Metrics: class { performance = mockPerformance; }
}));

describe("metrics performance", () => {
  beforeEach(() => {
    mockPerformance.mockReset().mockResolvedValue(fake.response);
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "table").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should retrieve performance metrics with the provided filters", async () => {
    await runCommand(performance, { rawArgs: fake.args });

    const { buckets, ...summary } = fake.response.data;
    const timeSeries = buildMetricsTimeSeries(buckets);

    expect(mockPerformance).toHaveBeenCalledWith(fake.options);
    expect(console.table).toHaveBeenCalledWith(toWordsKeys(timeSeries));
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining(
        "[Metrics] Performance metrics summary:" + tabulatedSections(summary)
      )
    );
  });

  it("should report when no performance data is available", async () => {
    mockPerformance.mockResolvedValueOnce({
      ...fake.response,
      data: {
        ...fake.response.data,
        buckets: {
          bounced: [],
          complained: [],
          delivered: [],
          processed: []
        }
      }
    });

    await runCommand(performance, { rawArgs: fake.args });

    expect(console.info).toHaveBeenCalledWith(
      "[Metrics] No performance data available for the specified period."
    );
  });

  it("should exit with error when retrieving performance metrics fails", async () => {
    mockPerformance.mockResolvedValueOnce({ data: null, error: { message: "API Error" } });

    await expect(
      runCommand(performance, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
