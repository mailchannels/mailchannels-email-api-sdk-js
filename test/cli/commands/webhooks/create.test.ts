import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import create from "~/cli/commands/webhooks/create";
import type { SuccessResponse } from "~/types/responses";

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

  it("should create a webhook without a failure threshold when the flag is omitted", async () => {
    await runCommand(create, { rawArgs: fake.args });

    expect(mockCreate).toHaveBeenCalledWith(fake.endpoint, { failureThreshold: undefined });
  });

  it("should create a webhook with a failure threshold when the flag is provided", async () => {
    await runCommand(create, {
      rawArgs: [...fake.args, "--failure-threshold", "1"]
    });

    expect(mockCreate).toHaveBeenCalledWith(fake.endpoint, { failureThreshold: 1 });
  });

  it.each([
    { input: "a bare flag", args: ["--failure-threshold"] },
    { input: "an empty value", args: ["--failure-threshold", ""] },
    { input: "an empty inline value", args: ["--failure-threshold="] },
    { input: "whitespace", args: ["--failure-threshold", "  "] },
    { input: "a negated flag", args: ["--no-failure-threshold"] },
    { input: "a fraction", args: ["--failure-threshold", "1.5"] },
    { input: "non-decimal notation", args: ["--failure-threshold", "0x10"] }
  ])("should reject $input for failure-threshold before calling the SDK", async ({ args }) => {
    await expect(
      runCommand(create, { rawArgs: [...fake.args, ...args] })
    ).rejects.toThrow();

    expect(mockCreate).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      "[Webhooks] '--failure-threshold' must be an integer value."
    );
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
