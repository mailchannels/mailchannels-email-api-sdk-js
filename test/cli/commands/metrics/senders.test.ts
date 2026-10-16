import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import senders from "~/cli/commands/metrics/senders";
import { tabulatedSections } from "~/cli/utils/shared/sections";
import type { MetricsSendersResponse } from "~/types/metrics/senders";

const fake = {
  args: [
    "--api-key", "test-api-key",
    "--type", "campaigns",
    "--start-time", "2025-01-01",
    "--end-time", "2025-01-02",
    "--limit", "25",
    "--offset", "5",
    "--sort-order", "asc"
  ],
  type: "campaigns",
  options: {
    startTime: "2025-01-01",
    endTime: "2025-01-02",
    limit: 25,
    offset: 5,
    sortOrder: "asc"
  },
  response: {
    data: {
      endTime: "2025-01-02T00:00:00Z",
      limit: 25,
      offset: 5,
      senders: [{
        bounced: 1,
        delivered: 2,
        dropped: 3,
        name: "campaign-123",
        processed: 6
      }],
      startTime: "2025-01-01T00:00:00Z",
      total: 1
    },
    error: null
  } satisfies MetricsSendersResponse
};

const mockSenders = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Metrics: class { senders = mockSenders; }
}));

describe("metrics senders", () => {
  beforeEach(() => {
    mockSenders.mockReset().mockResolvedValue(fake.response);
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "table").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should retrieve sender metrics with the provided filters", async () => {
    await runCommand(senders, { rawArgs: fake.args });

    expect(mockSenders).toHaveBeenCalledWith(fake.type, fake.options);
    expect(console.info).toHaveBeenCalledWith(
      "[Metrics] Sender metrics by sender:"
    );
    expect(console.table).toHaveBeenCalledWith([{
      Bounced: 1,
      Delivered: 2,
      Dropped: 3,
      Name: "campaign-123",
      Processed: 6
    }]);
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining(
        "[Metrics] Sender metrics summary:" + tabulatedSections({
          endTime: fake.response.data.endTime,
          limit: fake.response.data.limit,
          offset: fake.response.data.offset,
          startTime: fake.response.data.startTime,
          total: fake.response.data.total
        })
      )
    );
  });

  it("should report when no sender data is available", async () => {
    mockSenders.mockResolvedValueOnce({
      ...fake.response,
      data: {
        ...fake.response.data,
        senders: []
      }
    });

    await runCommand(senders, { rawArgs: fake.args });

    expect(console.info).toHaveBeenCalledWith(
      "[Metrics] No sender data available for the specified period."
    );
  });

  it("should exit with error when retrieving sender metrics fails", async () => {
    mockSenders.mockResolvedValueOnce({ data: null, error: { message: "API Error" } });

    await expect(
      runCommand(senders, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
