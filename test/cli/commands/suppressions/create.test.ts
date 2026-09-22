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
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockClear();
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
    const input = JSON.stringify(fake.entries);

    vi.spyOn(process.stdin, Symbol.asyncIterator).mockImplementationOnce(
      async function* (): AsyncGenerator<string, undefined, unknown> {
        yield input;
      }
    );

    await runCommand(create, {
      rawArgs: ["--api-key", "test-api-key", "--entries"]
    });

    expect(mockCreate).toHaveBeenCalledWith(fake.entries, { addToSubAccounts: false });
  });

  it("should create a single entry without optional fields", async () => {
    const recipient = "minimal@example.com";

    await runCommand(create, {
      rawArgs: ["--api-key", "test-api-key", "--recipient", recipient]
    });

    expect(mockCreate).toHaveBeenCalledWith([{ recipient }], { addToSubAccounts: false });
  });

  it("should warn when entries and recipient are both provided", async () => {
    const input = JSON.stringify(fake.entries);

    vi.spyOn(process.stdin, Symbol.asyncIterator).mockImplementationOnce(
      async function* (): AsyncGenerator<string, undefined, unknown> {
        yield input;
      }
    );

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
    vi.spyOn(process, "stdin", "get").mockReturnValueOnce({ isTTY: true } as NodeJS.ReadStream & { fd: 0 });

    await expect(
      runCommand(create, {
        rawArgs: ["--api-key", "test-api-key", "--entries"]
      })
    ).rejects.toThrow();
  });

  it("should exit with error on invalid entries JSON", async () => {
    vi.spyOn(process.stdin, Symbol.asyncIterator).mockImplementationOnce(
      async function* (): AsyncGenerator<string, undefined, unknown> {
        yield "invalid-json";
      }
    );

    await expect(
      runCommand(create, {
        rawArgs: ["--api-key", "test-api-key", "--entries"]
      })
    ).rejects.toThrow();
  });

  it("should exit with error when entries contain an invalid value", async () => {
    vi.spyOn(process.stdin, Symbol.asyncIterator).mockImplementationOnce(
      async function* (): AsyncGenerator<string, undefined, unknown> {
        yield JSON.stringify([null]);
      }
    );

    await expect(
      runCommand(create, {
        rawArgs: ["--api-key", "test-api-key", "--entries"]
      })
    ).rejects.toThrow();
  });

  it("should reject entries when types is not an array", async () => {
    vi.spyOn(process.stdin, Symbol.asyncIterator).mockImplementationOnce(
      async function* (): AsyncGenerator<string, undefined, unknown> {
        yield JSON.stringify([{ recipient: "person@example.com", types: {} }]);
      }
    );

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
