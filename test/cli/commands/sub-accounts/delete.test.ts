import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import deleteSubAccount from "~/cli/commands/sub-accounts/delete";
import type { SuccessResponse } from "~/types/responses";

const fake = {
  args: ["--api-key", "test-api-key"],
  handle: "acme",
  response: {
    success: true,
    error: null
  } satisfies SuccessResponse
};

const mockDelete = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  SubAccounts: class { delete = mockDelete; }
}));

describe("delete", () => {
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

  it("should delete a sub-account by handle", async () => {
    await runCommand(deleteSubAccount, {
      rawArgs: [...fake.args, "--handle", fake.handle]
    });

    expect(mockDelete).toHaveBeenCalledWith(fake.handle);
  });

  it("should exit with error when the delete request fails", async () => {
    mockDelete.mockResolvedValueOnce({ success: false, error: { message: "API Error" } });

    await expect(
      runCommand(deleteSubAccount, {
        rawArgs: [...fake.args, "--handle", fake.handle]
      })
    ).rejects.toThrow();
  });
});
