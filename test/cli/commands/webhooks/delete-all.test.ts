import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import webhooks from "~/cli/commands/webhooks";
import type { SuccessResponse } from "~/types/responses";

// @ts-expect-error defineCommand does not handle well sub command types
const deleteAll = await webhooks.subCommands?.["delete-all"];

const fake = {
  args: ["--api-key", "test-api-key"],
  response: {
    success: true,
    error: null
  } satisfies SuccessResponse
};

const mockDeleteAll = vi.fn().mockResolvedValue({ error: null });

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Webhooks: class { deleteAll = mockDeleteAll; }
}));

describe("delete-all", () => {
  beforeEach(() => {
    mockDeleteAll.mockClear();
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should delete all webhooks with valid arguments", async () => {
    await runCommand(deleteAll, { rawArgs: fake.args });

    expect(mockDeleteAll).toHaveBeenCalledWith();
  });

  it("should exit with error on API delete failure", async () => {
    mockDeleteAll.mockResolvedValueOnce({ error: { message: "API Error" } });

    await expect(
      runCommand(deleteAll, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
