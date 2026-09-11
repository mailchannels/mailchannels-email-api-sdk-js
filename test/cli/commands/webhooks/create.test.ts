import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import webhooks from "~/cli/commands/webhooks";
import type { SuccessResponse } from "~/types/responses";

// @ts-expect-error defineCommand does not handle well sub command types
const create = await webhooks.subCommands?.create;

const fake = {
  args: [
    "--api-key", "test-api-key",
    "--endpoint", "https://example.com/webhook"
  ],
  endpoint: "https://example.com/webhook",
  response: {
    success: true,
    error: null
  } satisfies SuccessResponse
};

const mockCreate = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Webhooks: class { create = mockCreate; }
}));

describe("create", () => {
  beforeEach(() => {
    mockCreate.mockClear();
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should create a webhook with valid arguments", async () => {
    await runCommand(create, { rawArgs: fake.args });

    expect(mockCreate).toHaveBeenCalledWith(fake.endpoint);
  });

  it("should exit with error on API create failure", async () => {
    mockCreate.mockResolvedValueOnce({ error: { message: "API Error" } });

    await expect(
      runCommand(create, { rawArgs: fake.args })
    ).rejects.toThrow();
  });

  it("should exit with error when the endpoint is missing", async () => {
    await expect(
      runCommand(create, { rawArgs: ["--api-key", "test-api-key"] })
    ).rejects.toThrow();

    expect(mockCreate).not.toHaveBeenCalled();
  });
});
