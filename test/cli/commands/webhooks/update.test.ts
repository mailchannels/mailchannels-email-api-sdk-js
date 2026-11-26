import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import update from "~/cli/commands/webhooks/update";
import type { SuccessResponse } from "~/types/responses";

const endpoint = "https://example.com/webhook";
const fake = {
  args: [
    "--api-key", "test-api-key",
    "-e", endpoint,
    "--failure-threshold", "1"
  ],
  endpoint,
  response: {
    success: true,
    error: null
  } satisfies SuccessResponse
};

const mockUpdate = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Webhooks: class { update = mockUpdate; }
}));

describe("update", () => {
  beforeEach(() => {
    mockUpdate.mockClear();
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should update a webhook with a numeric failure threshold", async () => {
    await runCommand(update, { rawArgs: fake.args });

    expect(mockUpdate).toHaveBeenCalledWith(fake.endpoint, 1);
    expect(console.info).toHaveBeenCalledWith("[Webhooks] Webhook updated successfully.");
  });

  it("should exit with error when the endpoint is missing", async () => {
    await expect(
      runCommand(update, { rawArgs: ["--api-key", "test-api-key", "--failure-threshold", "1"] })
    ).rejects.toThrow();

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("should exit with error when the failure threshold is missing", async () => {
    await expect(
      runCommand(update, { rawArgs: ["--api-key", "test-api-key", "--endpoint", fake.endpoint] })
    ).rejects.toThrow();

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("should exit with error on API update failure", async () => {
    mockUpdate.mockResolvedValueOnce({ error: { message: "API Error" } });

    await expect(
      runCommand(update, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
