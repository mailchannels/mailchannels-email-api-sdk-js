import { afterAll, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import emails from "~/cli/commands/emails";

// @ts-expect-error defineCommand does not handle well sub command types
const queue = await emails.subCommands?.queue;

const mockQueue = vi.fn().mockResolvedValue({ error: null });

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Emails: class { queue = mockQueue;}
}));

const fake = {
  args: [
    "--api-key", "test-api-key",
    "--from", "test@example.com",
    "--to", "recipient@example.com",
    "--subject", "Test Email",
    "--text", "This is a test email."
  ],
  response: {
    from: "test@example.com",
    to: ["recipient@example.com"],
    subject: "Test Email",
    text: "This is a test email."
  }
};

describe("queue", () => {
  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should send an email with valid arguments", async () => {
    await runCommand(queue, { rawArgs: fake.args });
    expect(mockQueue).toHaveBeenCalledWith(expect.objectContaining(fake.response));
  });

  it("should exit with error on API send failure", async () => {
    mockQueue.mockResolvedValueOnce({ error: new Error("API Error") });
    await expect(
      runCommand(queue, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
