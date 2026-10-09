import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import deletePassword from "~/cli/commands/sub-accounts/smtp-passwords/delete";

const fake = {
  args: ["--api-key", "test-api-key"],
  handle: "examplecompany",
  id: 456,
  response: { success: true, error: null }
};

const mockDelete = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  SubAccounts: class { smtpPasswords = { delete: mockDelete }; }
}));

describe("smtp-passwords delete", () => {
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

  it("should delete an SMTP password by ID", async () => {
    await runCommand(deletePassword, {
      rawArgs: [...fake.args, "--handle", fake.handle, "--id", String(fake.id)]
    });

    expect(mockDelete).toHaveBeenCalledWith(fake.handle, fake.id);
  });

  it("should exit with error when deleting an SMTP password fails", async () => {
    mockDelete.mockResolvedValueOnce({ success: false, error: { message: "API Error" } });

    await expect(
      runCommand(deletePassword, {
        rawArgs: [...fake.args, "--handle", fake.handle, "--id", String(fake.id)]
      })
    ).rejects.toThrow();
  });
});
