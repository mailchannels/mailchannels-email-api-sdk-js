import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import engagement from "~/cli/commands/metrics/engagement";
import { tabulatedSections } from "~/cli/utils/shared/sections";
import { toWordsKeys } from "~/cli/utils/shared/style";
import { buildMetricsTimeSeries } from "~/cli/utils/metrics/time-series";
import type { MetricsEngagementResponse } from "~/types/metrics/engagement";

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
      buckets: {
        click: [{ count: 1, periodStart: "2026-10-13T00:00:00Z" }],
        clickTrackingDelivered: [{ count: 1, periodStart: "2026-10-13T00:00:00Z" }],
        open: [{ count: 1, periodStart: "2026-10-13T00:00:00Z" }],
        openTrackingDelivered: [{ count: 1, periodStart: "2026-10-13T00:00:00Z" }],
        uniqueClick: [{ count: 1, periodStart: "2026-10-13T00:00:00Z" }],
        uniqueClickTrackingDelivered: [{ count: 1, periodStart: "2026-10-13T00:00:00Z" }],
        uniqueOpen: [{ count: 1, periodStart: "2026-10-13T00:00:00Z" }],
        uniqueOpenTrackingDelivered: [{ count: 1, periodStart: "2026-10-13T00:00:00Z" }]
      },
      click: 1,
      clickTrackingDelivered: 1,
      endTime: "2026-10-30",
      open: 1,
      openTrackingDelivered: 1,
      startTime: "2026-09-30",
      uniqueClick: 1,
      uniqueClickTrackingDelivered: 1,
      uniqueOpen: 1,
      uniqueOpenTrackingDelivered: 1
    },
    error: null
  } satisfies MetricsEngagementResponse
};

const mockEngagement = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Metrics: class { engagement = mockEngagement; }
}));

describe("metrics engagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEngagement.mockReset().mockResolvedValue(fake.response);
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "table").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should retrieve engagement metrics with the provided filters", async () => {
    await runCommand(engagement, { rawArgs: fake.args });

    const { buckets, ...summary } = fake.response.data;
    const timeSeries = buildMetricsTimeSeries({
      click: buckets.click,
      clickTrackingDelivered: buckets.clickTrackingDelivered,
      open: buckets.open,
      openTrackingDelivered: buckets.openTrackingDelivered
    });

    const uniqueTimeSeries = buildMetricsTimeSeries({
      uniqueClick: buckets.uniqueClick,
      uniqueClickTrackingDelivered: buckets.uniqueClickTrackingDelivered,
      uniqueOpen: buckets.uniqueOpen,
      uniqueOpenTrackingDelivered: buckets.uniqueOpenTrackingDelivered
    });

    expect(mockEngagement).toHaveBeenCalledWith(fake.options);
    expect(console.table).toHaveBeenNthCalledWith(1, toWordsKeys(timeSeries));
    expect(console.table).toHaveBeenNthCalledWith(2, toWordsKeys(uniqueTimeSeries));
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining(
        "[Metrics] Engagement metrics summary:" + tabulatedSections(summary)
      )
    );
  });

  it("should report when no engagement data is available", async () => {
    mockEngagement.mockResolvedValueOnce({
      ...fake.response,
      data: {
        ...fake.response.data,
        buckets: {
          click: [],
          clickTrackingDelivered: [],
          open: [],
          openTrackingDelivered: [],
          uniqueClick: [],
          uniqueClickTrackingDelivered: [],
          uniqueOpen: [],
          uniqueOpenTrackingDelivered: []
        }
      }
    });

    await runCommand(engagement, { rawArgs: fake.args });

    expect(console.info).toHaveBeenCalledWith(
      "[Metrics] No engagement data available for the specified period."
    );
  });

  it("should omit the unique time series when no unique data is available", async () => {
    mockEngagement.mockResolvedValueOnce({
      ...fake.response,
      data: {
        ...fake.response.data,
        buckets: {
          ...fake.response.data.buckets,
          uniqueClick: [],
          uniqueClickTrackingDelivered: [],
          uniqueOpen: [],
          uniqueOpenTrackingDelivered: []
        }
      }
    });

    await runCommand(engagement, { rawArgs: fake.args });

    expect(console.table).toHaveBeenCalledTimes(1);
    expect(console.info).not.toHaveBeenCalledWith(
      "[Metrics] Unique engagement metrics time series by period:"
    );
  });

  it("should exit with error when retrieving engagement metrics fails", async () => {
    mockEngagement.mockResolvedValueOnce({ data: null, error: { message: "API Error" } });

    await expect(
      runCommand(engagement, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
