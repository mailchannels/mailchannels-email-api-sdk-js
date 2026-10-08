import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import list from "~/cli/commands/sub-accounts/smtp-passwords/list";
import { toWordsKeys } from "~/cli/utils/shared/style";

const fake = {
  args: ["--api-key", "test-api-key"],
  handle: "examplecompany",
  smtpPasswords: [{ enabled: true, id: 456, smtpPassword: "mc-smtp-password" }]
};

const mockList = vi.fn().mockResolvedValue({ data: fake.smtpPasswords, error: null });

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  SubAccounts: class { smtpPasswords = { list: mockList }; }
}));

describe("smtp-passwords list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "table").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should list SMTP passwords for a sub-account", async () => {
    await runCommand(list, {
      rawArgs: [...fake.args, "--handle", fake.handle]
    });

    expect(mockList).toHaveBeenCalledWith(fake.handle);
    expect(console.table).toHaveBeenCalledWith(
      toWordsKeys(fake.smtpPasswords)
    );
  });

  it("should report when no SMTP passwords are found", async () => {
    mockList.mockResolvedValueOnce({ data: [], error: null });

    await runCommand(list, {
      rawArgs: [...fake.args, "--handle", fake.handle]
    });

    expect(console.info).toHaveBeenCalledWith("[Sub-Accounts] No SMTP passwords found for this sub-account.");
  });

  it("should exit with error when listing SMTP passwords fails", async () => {
    mockList.mockResolvedValueOnce({ data: null, error: { message: "API Error" } });

    await expect(
      runCommand(list, {
        rawArgs: [...fake.args, "--handle", fake.handle]
      })
    ).rejects.toThrow();
  });
});
