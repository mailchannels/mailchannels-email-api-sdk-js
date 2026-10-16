import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import volume from "~/cli/commands/metrics/volume";
import { tabulatedSections } from "~/cli/utils/shared/sections";
import { toWordsKeys } from "~/cli/utils/shared/style";
import { buildMetricsTimeSeries } from "~/cli/utils/metrics/time-series";
import type { MetricsVolumeResponse } from "~/types/metrics/volume";

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
        delivered: [{ count: 1, periodStart: "2026-10-13T00:00:00Z" }],
        dropped: [{ count: 2, periodStart: "2026-10-13T00:00:00Z" }],
        processed: [{ count: 3, periodStart: "2026-10-13T00:00:00Z" }]
      },
      delivered: 1,
      dropped: 2,
      endTime: "2026-10-30T00:00:00Z",
      processed: 3,
      startTime: "2026-09-30T00:00:00Z"
    },
    error: null
  } satisfies MetricsVolumeResponse
};

const mockVolume = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Metrics: class { volume = mockVolume; }
}));

describe("metrics volume", () => {
  beforeEach(() => {
    mockVolume.mockReset().mockResolvedValue(fake.response);
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "table").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should retrieve volume metrics with the provided filters", async () => {
    await runCommand(volume, { rawArgs: fake.args });

    const { buckets, ...summary } = fake.response.data;
    const timeSeries = buildMetricsTimeSeries(buckets);

    expect(mockVolume).toHaveBeenCalledWith(fake.options);
    expect(console.table).toHaveBeenCalledWith(toWordsKeys(timeSeries));
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining(
        "[Metrics] Volume metrics summary:" + tabulatedSections(summary)
      )
    );
  });

  it("should report when no volume data is available", async () => {
    mockVolume.mockResolvedValueOnce({
      ...fake.response,
      data: {
        ...fake.response.data,
        buckets: {
          delivered: [],
          dropped: [],
          processed: []
        }
      }
    });

    await runCommand(volume, { rawArgs: fake.args });

    expect(console.info).toHaveBeenCalledWith(
      "[Metrics] No volume data available for the specified period."
    );
  });

  it("should exit with error when retrieving volume metrics fails", async () => {
    mockVolume.mockResolvedValueOnce({ data: null, error: { message: "API Error" } });

    await expect(
      runCommand(volume, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
