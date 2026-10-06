import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import create from "~/cli/commands/sub-accounts/create";
import { tabulatedSections } from "~/cli/utils/shared/sections";
import type { SubAccountsCreateResponse } from "~/types/sub-accounts/create";

const fake = {
  args: ["--api-key", "test-api-key"],
  companyName: "Acme Corp",
  handle: "acme",
  response: {
    data: {
      companyName: "Acme Corp",
      enabled: true,
      handle: "acme"
    },
    error: null
  } satisfies SubAccountsCreateResponse
};

const mockCreate = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  SubAccounts: class { create = mockCreate; }
}));

describe("create", () => {
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

  it("should create a sub-account with an optional handle", async () => {
    await runCommand(create, {
      rawArgs: [...fake.args, "--company-name", fake.companyName, "--handle", fake.handle]
    });

    expect(mockCreate).toHaveBeenCalledWith(fake.companyName, fake.handle);
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[Sub-Accounts] Sub-account created successfully:"
        + tabulatedSections(fake.response.data)
      )
    );
  });

  it("should exit with error when creating a sub-account fails", async () => {
    mockCreate.mockResolvedValueOnce({ data: null, error: { message: "API Error" } });

    await expect(
      runCommand(create, {
        rawArgs: [...fake.args, "--company-name", fake.companyName, "--handle", fake.handle]
      })
    ).rejects.toThrow();
  });
});
