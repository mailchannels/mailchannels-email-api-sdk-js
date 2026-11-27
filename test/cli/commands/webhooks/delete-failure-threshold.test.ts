import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import deleteFailureThreshold from "~/cli/commands/webhooks/delete-failure-threshold";
import type { SuccessResponse } from "~/types/responses";

const endpoint = "https://example.com/webhook";
const fake = {
  args: [
    "--api-key", "test-api-key",
    "-e", endpoint
  ],
  endpoint,
  response: {
    success: true,
    error: null
  } satisfies SuccessResponse
};

const mockDeleteFailureThreshold = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Webhooks: class { deleteFailureThreshold = mockDeleteFailureThreshold; }
}));

describe("delete-failure-threshold", () => {
  beforeEach(() => {
    mockDeleteFailureThreshold.mockClear();
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should remove the failure threshold for the requested endpoint", async () => {
    await runCommand(deleteFailureThreshold, { rawArgs: fake.args });

    expect(mockDeleteFailureThreshold).toHaveBeenCalledWith(fake.endpoint);
    expect(console.info).toHaveBeenCalledWith("[Webhooks] Failure threshold removed successfully.");
  });

  it("should exit with error when the endpoint is missing", async () => {
    await expect(
      runCommand(deleteFailureThreshold, { rawArgs: ["--api-key", "test-api-key"] })
    ).rejects.toThrow("Missing required argument: --endpoint");

    expect(mockDeleteFailureThreshold).not.toHaveBeenCalled();
  });

  it("should exit with error on API delete failure", async () => {
    mockDeleteFailureThreshold.mockResolvedValueOnce({ error: { message: "API Error" } });

    await expect(
      runCommand(deleteFailureThreshold, { rawArgs: fake.args })
    ).rejects.toThrow();

    expect(console.error).toHaveBeenCalledWith("[Webhooks] API Error");
  });
});
