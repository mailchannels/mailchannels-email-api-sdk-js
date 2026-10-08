import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import type { SuccessResponse } from "~/types/responses";
import set from "~/cli/commands/sub-accounts/limits/set";

const fake = {
  args: ["--api-key", "test-api-key"],
  handle: "acme",
  sends: 5000,
  response: {
    success: true,
    error: null
  } satisfies SuccessResponse
};

const mockSet = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  SubAccounts: class { limits = { set: mockSet }; }
}));

describe("limits set", () => {
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

  it("should set a sub-account limit", async () => {
    await runCommand(set, {
      rawArgs: [...fake.args, "--handle", fake.handle, "--sends", String(fake.sends)]
    });

    expect(mockSet).toHaveBeenCalledWith(fake.handle, { sends: fake.sends });
  });

  it("should exit with error when setting a sub-account limit fails", async () => {
    mockSet.mockResolvedValueOnce({ success: false, error: { message: "API Error" } });

    await expect(
      runCommand(set, {
        rawArgs: [...fake.args, "--handle", fake.handle, "--sends", String(fake.sends)]
      })
    ).rejects.toThrow();
  });
});
