import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import suppressions from "~/cli/commands/suppressions";
import type { SuccessResponse } from "~/types/responses";

// @ts-expect-error defineCommand does not handle well sub command types
const deleteCommand = await suppressions.subCommands?.delete;

const fake = {
  args: [
    "--api-key", "test-api-key",
    "--recipient", "recipient@example.com",
    "--source", "all"
  ],
  recipient: "recipient@example.com",
  source: "all" as const,
  response: {
    success: true,
    error: null
  } satisfies SuccessResponse
};

const mockDelete = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Suppressions: class { delete = mockDelete; }
}));

describe("delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDelete.mockClear();
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should delete a suppression entry with valid arguments", async () => {
    await runCommand(deleteCommand, { rawArgs: fake.args });

    expect(mockDelete).toHaveBeenCalledWith(fake.recipient, fake.source);
  });

  it("should exit with error when the recipient is missing", async () => {
    await expect(
      runCommand(deleteCommand, { rawArgs: ["--api-key", "test-api-key"] })
    ).rejects.toThrow();

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("should exit with error on API delete failure", async () => {
    mockDelete.mockResolvedValueOnce({ error: { message: "API Error" } });

    await expect(
      runCommand(deleteCommand, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
