import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import usage from "~/cli/commands/sub-accounts/usage";
import { tabulatedSections } from "~/cli/utils/shared/sections";
import type { SubAccountsUsageResponse } from "~/types/sub-accounts/usage";

const fake = {
  args: ["--api-key", "test-api-key"],
  handle: "acme",
  response: {
    data: {
      endDate: "2026-10-23",
      startDate: "2026-09-23",
      total: 250,
      monthlyLimit: 5000
    },
    error: null
  } satisfies SubAccountsUsageResponse
};

const mockGetUsage = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  SubAccounts: class { getUsage = mockGetUsage; }
}));

describe("usage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should retrieve sub-account usage by handle", async () => {
    await runCommand(usage, {
      rawArgs: [...fake.args, "--handle", fake.handle]
    });

    expect(mockGetUsage).toHaveBeenCalledWith(fake.handle);
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[Sub-Accounts] Sub-account usage:"
        + tabulatedSections(fake.response.data)
      )
    );
  });

  it("should exit with error when retrieving sub-account usage fails", async () => {
    mockGetUsage.mockResolvedValueOnce({ data: null, error: { message: "API Error" } });

    await expect(
      runCommand(usage, {
        rawArgs: [...fake.args, "--handle", fake.handle]
      })
    ).rejects.toThrow();
  });
});
