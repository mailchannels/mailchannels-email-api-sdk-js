import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import create from "~/cli/commands/sub-accounts/api-keys/create";
import { tabulatedSections } from "~/cli/utils/shared/sections";
import type { SubAccountsApiKeysCreateResponse } from "~/types/sub-accounts/api-keys";

const fake = {
  args: ["--api-key", "test-api-key"],
  handle: "acme",
  response: {
    data: { id: 123, key: "mc-sub-account-api-key" },
    error: null
  } satisfies SubAccountsApiKeysCreateResponse
};

const mockCreate = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  SubAccounts: class { apiKeys = { create: mockCreate }; }
}));

describe("api-keys create", () => {
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

  it("should create an API key for a sub-account", async () => {
    await runCommand(create, {
      rawArgs: [...fake.args, "--handle", fake.handle]
    });

    expect(mockCreate).toHaveBeenCalledWith(fake.handle);
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[Sub-Accounts] Sub-account API key created:"
        + tabulatedSections(fake.response.data)
      )
    );
  });

  it("should exit with error when creating an API key fails", async () => {
    mockCreate.mockResolvedValueOnce({ data: null, error: { message: "API Error" } });

    await expect(
      runCommand(create, {
        rawArgs: [...fake.args, "--handle", fake.handle]
      })
    ).rejects.toThrow();
  });
});
