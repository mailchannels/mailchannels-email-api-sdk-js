import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import create from "~/cli/commands/sub-accounts/smtp-passwords/create";
import { tabulatedSections } from "~/cli/utils/shared/sections";
import type { SubAccountsSmtpPasswordsCreateResponse } from "~/types/sub-accounts/smtp-passwords";

const fake = {
  args: ["--api-key", "test-api-key"],
  handle: "acme",
  response: {
    data: { enabled: true, id: 456, smtpPassword: "mc-smtp-password" },
    error: null
  } satisfies SubAccountsSmtpPasswordsCreateResponse
};

const mockCreate = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  SubAccounts: class { smtpPasswords = { create: mockCreate }; }
}));

describe("smtp-passwords create", () => {
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

  it("should create an SMTP password for a sub-account", async () => {
    await runCommand(create, {
      rawArgs: [...fake.args, "--handle", fake.handle]
    });

    expect(mockCreate).toHaveBeenCalledWith(fake.handle);
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[Sub-Accounts] Sub-account SMTP password created:"
        + tabulatedSections(fake.response.data)
      )
    );
  });

  it("should exit with error when creating an SMTP password fails", async () => {
    mockCreate.mockResolvedValueOnce({ data: null, error: { message: "API Error" } });

    await expect(
      runCommand(create, {
        rawArgs: [...fake.args, "--handle", fake.handle]
      })
    ).rejects.toThrow();
  });
});
