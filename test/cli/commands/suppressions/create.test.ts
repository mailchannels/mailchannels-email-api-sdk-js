import { PassThrough } from "node:stream";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import suppressions from "~/cli/commands/suppressions";
import type { SuccessResponse } from "~/types/responses";
import type { SuppressionsCreateEntry } from "~/types/suppressions/create";

// @ts-expect-error defineCommand does not handle well sub command types
const create = await suppressions.subCommands?.create;

const fake = {
  args: [
    "--api-key", "test-api-key",
    "--recipient", "recipient@example.com",
    "--types", "transactional,non-transactional",
    "--notes", "Test suppression",
    "--add-to-sub-accounts"
  ],
  entries: [
    {
      recipient: "recipient@example.com",
      types: ["transactional", "non-transactional"],
      notes: "Test suppression"
    }
  ] satisfies SuppressionsCreateEntry[],
  response: {
    success: true,
    error: null
  } satisfies SuccessResponse
};

const mockCreate = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Suppressions: class { create = mockCreate; }
}));

describe("create", () => {
  let stdin: PassThrough & { isTTY: boolean };

  beforeEach(() => {
    vi.clearAllMocks();
    stdin = Object.assign(new PassThrough({ readableObjectMode: true }), { isTTY: false });
    vi.spyOn(process, "stdin", "get").mockReturnValue(stdin as unknown as typeof process.stdin);
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should create suppression entries with valid arguments", async () => {
    await runCommand(create, { rawArgs: fake.args });

    expect(mockCreate).toHaveBeenCalledWith(fake.entries, { addToSubAccounts: true });
  });

  it("should create entries from a JSON array piped to stdin", async () => {
    stdin.end(JSON.stringify(fake.entries));

    await runCommand(create, {
      rawArgs: ["--api-key", "test-api-key", "--entries"]
    });

    expect(mockCreate).toHaveBeenCalledWith(fake.entries, { addToSubAccounts: false });
  });

  it("should parse UTF-8 suppression JSON split across stdin chunks", async () => {
    const entries = [{
      recipient: "recipient@example.com",
      notes: "Désabonné"
    }];

    const input = Buffer.from(JSON.stringify(entries));

    const split = input.indexOf("é") + 1;
    stdin.write(input.subarray(0, split));
    stdin.end(input.subarray(split));

    await runCommand(create, {
      rawArgs: ["--api-key", "test-api-key", "--entries"]
    });

    expect(mockCreate).toHaveBeenCalledWith(entries, { addToSubAccounts: false });
  });

  it("should create a single entry without optional fields", async () => {
    const recipient = "minimal@example.com";

    await runCommand(create, {
      rawArgs: ["--api-key", "test-api-key", "--recipient", recipient]
    });

    expect(mockCreate).toHaveBeenCalledWith([{ recipient }], { addToSubAccounts: false });
  });

  it("should warn when entries and recipient are both provided", async () => {
    stdin.end(JSON.stringify(fake.entries));

    await runCommand(create, {
      rawArgs: [
        "--api-key", "test-api-key",
        "--entries",
        "--recipient", "recipient@example.com",
        "--types", "transactional",
        "--notes", "Ignored note"
      ]
    });

    expect(mockCreate).toHaveBeenCalledWith(fake.entries, { addToSubAccounts: false });
    expect(console.warn).toHaveBeenCalledWith(
      "[Suppressions] Warning: both '--entries' and '--recipient' are provided. Using '--entries'."
    );
    expect(console.warn).toHaveBeenCalledWith(
      "[Suppressions] Warning: '--entries' ignores '--types' and '--notes'."
    );
  });

  it("should error on TTY when entries are expected", async () => {
    stdin.isTTY = true;

    await expect(
      runCommand(create, {
        rawArgs: ["--api-key", "test-api-key", "--entries"]
      })
    ).rejects.toThrow();

    expect(stdin.readableDidRead).toBe(false);
  });

  it("should exit with error on invalid entries JSON", async () => {
    stdin.end("invalid-json");

    await expect(
      runCommand(create, {
        rawArgs: ["--api-key", "test-api-key", "--entries"]
      })
    ).rejects.toThrow();

    expect(console.error).toHaveBeenCalledWith(
      "[Suppressions] JSON input for '--entries' is not valid."
    );
  });

  it("should propagate stdin read errors when reading entries", async () => {
    const readError = Object.assign(new Error("I/O error reading stdin"), { code: "EIO" });
    vi.spyOn(stdin, "_read").mockImplementationOnce(() => {
      stdin.destroy(readError);
    });

    await expect(runCommand(create, {
      rawArgs: ["--api-key", "test-api-key", "--entries"]
    })).rejects.toBe(readError);

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("should exit with error when entries contain an invalid value", async () => {
    stdin.end(JSON.stringify([null]));

    await expect(
      runCommand(create, {
        rawArgs: ["--api-key", "test-api-key", "--entries"]
      })
    ).rejects.toThrow();
  });

  it("should reject entries when types is not an array", async () => {
    stdin.end(JSON.stringify([{ recipient: "person@example.com", types: {} }]));

    await expect(
      runCommand(create, {
        rawArgs: ["--api-key", "test-api-key", "--entries"]
      })
    ).rejects.toThrow();

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("should exit with error when an entry is missing", async () => {
    await expect(
      runCommand(create, { rawArgs: ["--api-key", "test-api-key"] })
    ).rejects.toThrow();
  });

  it("should exit with error on API create failure", async () => {
    mockCreate.mockResolvedValueOnce({ error: { message: "API Error" } });

    await expect(
      runCommand(create, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
