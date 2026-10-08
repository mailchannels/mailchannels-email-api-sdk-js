import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import type { SuccessResponse } from "~/types/responses";
import deleteLimit from "~/cli/commands/sub-accounts/limit/delete";

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
  SubAccounts: class { limits = { delete: mockDelete }; }
}));

describe("limits delete", () => {
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

  it("should delete a sub-account limit", async () => {
    await runCommand(deleteLimit, {
      rawArgs: [...fake.args, "--handle", fake.handle]
    });

    expect(mockDelete).toHaveBeenCalledWith(fake.handle);
  });

  it("should exit with error when deleting a sub-account limit fails", async () => {
    mockDelete.mockResolvedValueOnce({ success: false, error: { message: "API Error" } });

    await expect(
      runCommand(deleteLimit, {
        rawArgs: [...fake.args, "--handle", fake.handle]
      })
    ).rejects.toThrow();
  });
});
