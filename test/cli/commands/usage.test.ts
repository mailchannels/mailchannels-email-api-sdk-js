import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import usage from "~/cli/commands/usage";
import { tabulatedSections } from "~/cli/utils/shared/sections";
import type { MetricsUsageResponse } from "~/types/metrics/usage";

const fake = {
  args: ["--api-key", "test-api-key"],
  response: {
    data: {
      startDate: "2026-09-15",
      endDate: "2026-10-15",
      total: 250,
      monthlyLimit: 5000
    },
    error: null
  } satisfies MetricsUsageResponse
};

const mockUsage = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Metrics: class { usage = mockUsage; }
}));

describe("usage", () => {
  beforeEach(() => {
    mockUsage.mockReset().mockResolvedValue(fake.response);
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should retrieve account usage", async () => {
    await runCommand(usage, { rawArgs: fake.args });

    expect(mockUsage).toHaveBeenCalledOnce();
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[Usage] Account usage:"
        + tabulatedSections(fake.response.data)
      )
    );
  });

  it("should exit with error when retrieving account usage fails", async () => {
    mockUsage.mockResolvedValueOnce({ data: null, error: { message: "API Error" } });

    await expect(
      runCommand(usage, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
