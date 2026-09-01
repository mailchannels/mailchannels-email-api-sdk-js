import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import emails from "~/cli/commands/emails";
import type { EmailsSendResponse } from "~/types/emails/send";

// @ts-expect-error defineCommand does not handle well sub command types
const send = await emails.subCommands?.send;

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
      requestId: "test-request-id",
      results: [{
        index: 0,
        messageId: "test-message-id",
        status: "sent"
      }]
    },
    error: null
  } satisfies EmailsSendResponse
};

const mockSend = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Emails: class { send = mockSend;}
}));

describe("send", () => {
  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should send an email with valid arguments", async () => {
    await runCommand(send, { rawArgs: fake.args });
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining(fake.options), false);
  });

  it("should send email with multiple recipients", async () => {
    const newArgs = [...fake.args];
    newArgs[newArgs.indexOf("--to") + 1] = "recipient1@example.com,recipient2@example.com";

    await runCommand(send, {
      rawArgs: [
        ...newArgs,
        "--cc", "cc1@example.com,cc2@example.com",
        "--bcc", "bcc1@example.com,bcc2@example.com"
      ]
    });
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      to: ["recipient1@example.com", "recipient2@example.com"]
    }), false);
  });

  it("should parse attachments", async () => {
    const input = JSON.stringify([
      {
        filename: "file_1.txt",
        content: "dGVzdA=="
      },
      {
        filename: "file_2.txt",
        content: "dGVzdDI=",
        type: "text/plain",
        content_id: "cid"
      }
    ]);

    vi.spyOn(process.stdin, Symbol.asyncIterator).mockImplementationOnce(
      async function* (): AsyncGenerator<string, undefined, unknown> {
        yield input;
      }
    );

    await runCommand(send, {
      rawArgs: [
        ...fake.args,
        "--attachments"
      ]
    });

    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      attachments: [
        {
          filename: "file_1.txt",
          content: "dGVzdA==",
          type: "text/plain"
        },
        {
          filename: "file_2.txt",
          content: "dGVzdDI=",
          type: "text/plain",
          contentId: "cid"
        }
      ]
    }), false);
  });

  it("should error on invalid attachments JSON", async () => {
    vi.spyOn(process.stdin, Symbol.asyncIterator).mockImplementationOnce(
      async function* (): AsyncGenerator<string, undefined, unknown> {
        yield "invalid-json";
      }
    );

    await expect(
      runCommand(send, {
        rawArgs: [
          ...fake.args,
          "--attachments"
        ]
      })
    ).rejects.toThrow();
  });

  it("should error on missing required fields in attachments", async () => {
    const input = JSON.stringify([
      {
        filename: "file_1.txt"
      }
    ]);

    vi.spyOn(process.stdin, Symbol.asyncIterator).mockImplementationOnce(
      async function* (): AsyncGenerator<string, undefined, unknown> {
        yield input;
      }
    );

    await expect(
      runCommand(send, {
        rawArgs: [
          ...fake.args,
          "--attachments"
        ]
      })
    ).rejects.toThrow();
  });

  it("should error on TTY when attachments are expected", async () => {
    vi.spyOn(process, "stdin", "get").mockReturnValueOnce({ isTTY: true } as NodeJS.ReadStream & { fd: 0 });

    await expect(
      runCommand(send, {
        rawArgs: [
          ...fake.args,
          "--attachments"
        ]
      })
    ).rejects.toThrow();
  });

  it("should parse headers", async () => {
    await runCommand(send, {
      rawArgs: [
        ...fake.args,
        "--headers", JSON.stringify({ "X-Custom-Header": "CustomValue" })
      ]
    });

    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      headers: {
        "X-Custom-Header": "CustomValue"
      }
    }), false);
  });

  it("should exit with error on missing API key", async () => {
    await expect(
      runCommand(send, { rawArgs: fake.args.filter(arg => arg !== "--api-key") })
    ).rejects.toThrow();
  });

  it("should exit with error on invalid headers JSON", async () => {
    await expect(
      runCommand(send, {
        rawArgs: [
          ...fake.args,
          "--headers", "invalid-json"
        ]
      })
    ).rejects.toThrow();
  });

  it("should exit with error on API send failure", async () => {
    mockSend.mockResolvedValueOnce({ error: { message: "API Error" } });

    await expect(
      runCommand(send, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
