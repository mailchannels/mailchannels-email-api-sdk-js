import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import get from "~/cli/commands/sub-accounts/limit/get";
import { tabulatedSections } from "~/cli/utils/shared/sections";
import type { SubAccountsLimitsGetResponse } from "~/types/sub-accounts/limits";

const fake = {
  args: ["--api-key", "test-api-key"],
  handle: "acme",
  response: {
    data: {
      sends: 5000
    },
    error: null
  } satisfies SubAccountsLimitsGetResponse
};

const mockGet = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  SubAccounts: class { limits = { get: mockGet }; }
}));

describe("limits get", () => {
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

  it("should get a sub-account limit", async () => {
    await runCommand(get, {
      rawArgs: [...fake.args, "--handle", fake.handle]
    });

    expect(mockGet).toHaveBeenCalledWith(fake.handle);
    expect(console.info).toHaveBeenCalledWith("[Sub-Accounts] Sub-account limit:"
      + tabulatedSections(fake.response.data)
    );
  });

  it("should exit with error when getting a sub-account limit fails", async () => {
    mockGet.mockResolvedValueOnce({ data: null, error: { message: "API Error" } });

    await expect(
      runCommand(get, {
        rawArgs: [...fake.args, "--handle", fake.handle]
      })
    ).rejects.toThrow();
  });
});
