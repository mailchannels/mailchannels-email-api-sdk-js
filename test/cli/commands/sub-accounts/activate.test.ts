import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import activate from "~/cli/commands/sub-accounts/activate";
import type { SuccessResponse } from "~/types/responses";

const fake = {
  args: ["--api-key", "test-api-key"],
  handle: "acme",
  response: {
    success: true,
    error: null
  } satisfies SuccessResponse
};

const mockActivate = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  SubAccounts: class { activate = mockActivate; }
}));

describe("activate", () => {
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

  it("should activate a sub-account by handle", async () => {
    await runCommand(activate, {
      rawArgs: [...fake.args, "--handle", fake.handle]
    });

    expect(mockActivate).toHaveBeenCalledWith(fake.handle);
  });

  it("should exit with error when activating a sub-account fails", async () => {
    mockActivate.mockResolvedValueOnce({ success: false, error: { message: "API Error" } });

    await expect(
      runCommand(activate, {
        rawArgs: [...fake.args, "--handle", fake.handle]
      })
    ).rejects.toThrow();
  });
});
