import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import emails from "~/cli/commands/emails";
import { tabulatedSections } from "~/cli/utils/shared/sections";
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
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should send an email with valid arguments", async () => {
    await runCommand(send, { rawArgs: fake.args });
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining(fake.options), false);
    expect(console.info).toHaveBeenCalledWith("[Emails] Request ID: test-request-id");
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[Emails] Email sent successfully."
        + tabulatedSections(fake.response.data.results ?? [])
      )
    );
  });

  it("should display rendered output for a dry run", async () => {
    mockSend.mockResolvedValueOnce({
      data: {
        requestId: "dry-run-request-id",
        rendered: ["Rendered email body"]
      },
      error: null
    });

    await runCommand(send, { rawArgs: [...fake.args, "--dry-run"] });

    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining(fake.options), true);
    expect(console.info).toHaveBeenCalledWith(
      "[Emails] Dry run performed, no email was actually sent."
    );
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[Emails] Rendered output:"
        + tabulatedSections(["Rendered email body"])
      )
    );
  });

  it.each([
    {
      description: "omitted",
      data: { requestId: "dry-run-request-id" }
    },
    {
      description: "empty",
      data: { requestId: "dry-run-request-id", rendered: [] }
    }
  ])("should omit rendered output when it is $description", async ({ data }) => {
    mockSend.mockResolvedValueOnce({ data, error: null });

    await runCommand(send, { rawArgs: [...fake.args, "--dry-run"] });

    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining(fake.options), true);
    expect(console.info).toHaveBeenCalledWith(
      "[Emails] Dry run performed, no email was actually sent."
    );
  });

  it.each([
    { description: "omitted", data: { requestId: "no-results-request-id" } },
    { description: "empty", data: { requestId: "no-results-request-id", results: [] } }
  ])("should report when send results are $description", async ({ data }) => {
    mockSend.mockResolvedValueOnce({ data, error: null });

    await runCommand(send, { rawArgs: fake.args });

    expect(console.info).toHaveBeenCalledWith(
      "[Emails] Email sent successfully. No results returned"
    );
  });

  it("should send an email with file content", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "mailchannels-cli-"));
    const textPath = join(tempDir, "hello.txt");
    const htmlPath = join(tempDir, "hello.html");
    const args = fake.args.filter((arg, i, arr) => arg !== "--text" && arr[i - 1] !== "--text");

    try {
      await writeFile(textPath, "Hello from a file");
      await writeFile(htmlPath, "<p>Hello from a file</p>");

      await runCommand(send, {
        rawArgs: [
          ...args,
          "--text-file", textPath,
          "--html-file", htmlPath
        ]
      });

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        text: "Hello from a file",
        html: "<p>Hello from a file</p>"
      }), false);
    }
    finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("should use file content when inline and file contents are provided", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "mailchannels-cli-"));
    const textPath = join(tempDir, "content.txt");
    const htmlPath = join(tempDir, "content.html");
    const args = fake.args.filter((arg, i, arr) => arg !== "--text" && arr[i - 1] !== "--text");

    try {
      await writeFile(textPath, "Hello from a file");
      await writeFile(htmlPath, "<p>Hello from a file</p>");

      await runCommand(send, {
        rawArgs: [
          ...args,
          "--text", "Inline content",
          "--text-file", textPath,
          "--html", "<p>Inline content</p>",
          "--html-file", htmlPath
        ]
      });

      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        text: "Hello from a file",
        html: "<p>Hello from a file</p>"
      }), false);
    }
    finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("should error on file read failure", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "mailchannels-cli-"));
    const textPath = join(tempDir, "not-found.txt");
    const args = fake.args.filter((arg, i, arr) => arg !== "--text" && arr[i - 1] !== "--text");

    try {
      await expect(
        runCommand(send, {
          rawArgs: [
            ...args,
            "--text-file", textPath
          ]
        })
      ).rejects.toThrow();
    }
    finally {
      await rm(tempDir, { recursive: true, force: true });
    }
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
    vi.spyOn(process, "stdin", "get").mockReturnValueOnce({
      isTTY: true
    } as NodeJS.ReadStream & { fd: 0 });

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
    vi.mocked(console.error).mockClear();
    mockSend.mockResolvedValueOnce({ error: { message: "API Error" } });

    await expect(
      runCommand(send, { rawArgs: fake.args })
    ).rejects.toThrow();
    expect(console.error).toHaveBeenCalledWith("[Emails] API Error");
  });
});
