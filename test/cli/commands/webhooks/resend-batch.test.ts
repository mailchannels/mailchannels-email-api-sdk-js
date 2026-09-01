import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import webhooks from "~/cli/commands/webhooks";
import type { WebhooksResendBatchResponse } from "~/types/webhooks/resend-batch";

// @ts-expect-error defineCommand does not handle well sub command types
const resendBatch = await webhooks.subCommands?.["resend-batch"];

const fake = {
  args: [
    "--api-key", "test-api-key",
    "--batch-id", "123"
  ],
  response: {
    data: {
      batchId: 123,
      customerHandle: "test-customer",
      webhook: "https://example.com/webhook",
      createdAt: "2026-06-10T15:51:28.071Z",
      eventCount: 2,
      duration: 5000,
      statusCode: 200
    },
    error: null
  } satisfies WebhooksResendBatchResponse
};

const mockResendBatch = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Webhooks: class { resendBatch = mockResendBatch; }
}));

describe("resend-batch", () => {
  beforeEach(() => {
    mockResendBatch.mockClear();
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "table").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should resend a webhook batch with a numeric batch ID", async () => {
    await runCommand(resendBatch, { rawArgs: fake.args });

    expect(mockResendBatch).toHaveBeenCalledWith(123);
  });

  it("should exit with error when the batch ID is missing", async () => {
    await expect(
      runCommand(resendBatch, { rawArgs: ["--api-key", "test-api-key"] })
    ).rejects.toThrow();

    expect(mockResendBatch).not.toHaveBeenCalled();
  });

  it("should exit with error on API resend failure", async () => {
    mockResendBatch.mockResolvedValueOnce({ error: { message: "API Error" } });

    await expect(
      runCommand(resendBatch, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
