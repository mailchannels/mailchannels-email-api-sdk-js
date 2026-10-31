import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import emails from "~/cli/commands/emails";
import { tabulatedSections } from "~/cli/utils/shared/sections";
import type { EmailsQueueResponse } from "~/types/emails/queue";

// @ts-expect-error defineCommand does not handle well sub command types
const queue = await emails.subCommands?.queue;

const fake = {
  args: [
    "--api-key", "test-api-key",
    "--from", "test@example.com",
    "--to", "recipient@example.com",
    "--subject", "Test Email",
    "--text", "This is a test email."
  ],
  options: {
    from: "test@example.com",
    to: ["recipient@example.com"],
    subject: "Test Email",
    text: "This is a test email."
  },
  response: {
    data: {
      queuedAt: "date-time-string",
      requestId: "test-async-request-id"
    },
    error: null
  } satisfies EmailsQueueResponse
};

const mockQueue = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Emails: class { queue = mockQueue; }
}));

describe("queue", () => {
  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should send an email with valid arguments", async () => {
    await runCommand(queue, { rawArgs: fake.args });
    expect(mockQueue).toHaveBeenCalledWith(expect.objectContaining(fake.options));
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[Emails] Email queued successfully."
        + tabulatedSections(fake.response.data)
      )
    );
  });

  it("should report when the queue response has no data", async () => {
    mockQueue.mockResolvedValueOnce({ data: null, error: null });

    await runCommand(queue, { rawArgs: fake.args });

    expect(console.info).toHaveBeenCalledWith("[Emails] Email queued successfully.");
  });

  it("should exit with error on API send failure", async () => {
    mockQueue.mockResolvedValueOnce({ error: { message: "API Error" } });

    await expect(
      runCommand(queue, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
