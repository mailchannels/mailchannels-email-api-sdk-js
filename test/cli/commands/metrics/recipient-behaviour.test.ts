import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import recipientBehaviour from "~/cli/commands/metrics/recipient-behaviour";
import { tabulatedSections } from "~/cli/utils/shared/sections";
import { toWordsKeys } from "~/cli/utils/shared/style";
import { buildMetricsTimeSeries } from "~/cli/utils/metrics/time-series";
import type { MetricsRecipientBehaviourResponse } from "~/types/metrics/recipient-behaviour";

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
        unsubscribeDelivered: [{ count: 1, periodStart: "2026-10-13T00:00:00Z" }],
        unsubscribed: [{ count: 2, periodStart: "2026-10-13T00:00:00Z" }]
      },
      endTime: "2026-10-30T00:00:00Z",
      startTime: "2026-09-30T00:00:00Z",
      unsubscribeDelivered: 1,
      unsubscribed: 2
    },
    error: null
  } satisfies MetricsRecipientBehaviourResponse
};

const mockRecipientBehaviour = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Metrics: class { recipientBehaviour = mockRecipientBehaviour; }
}));

describe("metrics recipient behaviour", () => {
  beforeEach(() => {
    mockRecipientBehaviour.mockReset().mockResolvedValue(fake.response);
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "table").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should retrieve recipient behaviour metrics with the provided filters", async () => {
    await runCommand(recipientBehaviour, { rawArgs: fake.args });

    const { buckets, ...summary } = fake.response.data;
    const timeSeries = buildMetricsTimeSeries(buckets);

    expect(mockRecipientBehaviour).toHaveBeenCalledWith(fake.options);
    expect(console.table).toHaveBeenCalledWith(toWordsKeys(timeSeries));
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining(
        "[Metrics] Recipient behaviour metrics summary:" + tabulatedSections(summary)
      )
    );
  });

  it("should report when no recipient behaviour data is available", async () => {
    mockRecipientBehaviour.mockResolvedValueOnce({
      ...fake.response,
      data: {
        ...fake.response.data,
        buckets: {
          unsubscribeDelivered: [],
          unsubscribed: []
        }
      }
    });

    await runCommand(recipientBehaviour, { rawArgs: fake.args });

    expect(console.info).toHaveBeenCalledWith(
      "[Metrics] No recipient behaviour data available for the specified period."
    );
  });

  it("should exit with error when retrieving recipient behaviour metrics fails", async () => {
    mockRecipientBehaviour.mockResolvedValueOnce({ data: null, error: { message: "API Error" } });

    await expect(
      runCommand(recipientBehaviour, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
