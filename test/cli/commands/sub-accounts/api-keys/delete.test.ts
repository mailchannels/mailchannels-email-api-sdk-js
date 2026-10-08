import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import deleteApiKey from "~/cli/commands/sub-accounts/api-keys/delete";
import type { SuccessResponse } from "~/types/responses";

const fake = {
  args: ["--api-key", "test-api-key"],
  handle: "acme",
  id: 123,
  response: {
    success: true,
    error: null
  } satisfies SuccessResponse
};

const mockDelete = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  SubAccounts: class { apiKeys = { delete: mockDelete }; }
}));

describe("api-keys delete", () => {
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

  it("should delete an API key by ID", async () => {
    await runCommand(deleteApiKey, {
      rawArgs: [...fake.args, "--handle", fake.handle, "--id", String(fake.id)]
    });

    expect(mockDelete).toHaveBeenCalledWith(fake.handle, fake.id);
  });

  it("should exit with error when deleting an API key fails", async () => {
    mockDelete.mockResolvedValueOnce({ success: false, error: { message: "API Error" } });

    await expect(
      runCommand(deleteApiKey, {
        rawArgs: [...fake.args, "--handle", fake.handle, "--id", String(fake.id)]
      })
    ).rejects.toThrow();
  });
});
