import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import suspend from "~/cli/commands/sub-accounts/suspend";
import type { SuccessResponse } from "~/types/responses";

const fake = {
  args: ["--api-key", "test-api-key"],
  handle: "acme",
  response: {
    success: true,
    error: null
  } satisfies SuccessResponse
};

const mockSuspend = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  SubAccounts: class { suspend = mockSuspend; }
}));

describe("suspend", () => {
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

  it("should suspend a sub-account by handle", async () => {
    await runCommand(suspend, {
      rawArgs: [...fake.args, "--handle", fake.handle]
    });

    expect(mockSuspend).toHaveBeenCalledWith(fake.handle);
  });

  it("should exit with error when suspending a sub-account fails", async () => {
    mockSuspend.mockResolvedValueOnce({ success: false, error: { message: "API Error" } });

    await expect(
      runCommand(suspend, {
        rawArgs: [...fake.args, "--handle", fake.handle]
      })
    ).rejects.toThrow();
  });
});
