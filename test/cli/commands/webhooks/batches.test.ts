import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import webhooks from "~/cli/commands/webhooks";
import type { WebhooksBatchesResponse } from "~/types/webhooks/batches";

// @ts-expect-error defineCommand does not handle well sub command types
const batches = await webhooks.subCommands?.batches;

const fake = {
  args: [
    "--api-key", "test-api-key",
    "--created-after", "2026-06-01",
    "--created-before", "2026-06-15",
    "--statuses", "2xx,5xx",
    "--webhook", "https://example.com/webhook",
    "--limit", "25",
    "--offset", "0"
  ],
  options: {
    createdAfter: "2026-06-01",
    createdBefore: "2026-06-15",
    statuses: ["2xx", "5xx"],
    webhook: "https://example.com/webhook",
    limit: 25,
    offset: 0
  },
  response: {
    data: [
      {
        batchId: 123,
        createdAt: "2026-06-10T15:51:28.071Z",
        customerHandle: "test-customer",
        duration: { unit: "milliseconds", value: 5000 },
        eventCount: 2,
        status: "2xx_response",
        statusCode: 200,
        webhook: "https://example.com/webhook"
      },
      {
        batchId: 124,
        createdAt: "2026-06-11T15:51:28.071Z",
        customerHandle: "test-customer",
        duration: undefined,
        eventCount: 2,
        status: "no_response",
        statusCode: null,
        webhook: "https://example.com/webhook"
      }
    ],
    error: null
  } satisfies WebhooksBatchesResponse
};

const mockBatches = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Webhooks: class { batches = mockBatches; }
}));

describe("batches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBatches.mockClear();
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "table").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should retrieve batches with parsed filters and pagination", async () => {
    await runCommand(batches, { rawArgs: fake.args });

    expect(mockBatches).toHaveBeenCalledWith(fake.options);
  });

  it("should report when no webhook batches are found", async () => {
    mockBatches.mockResolvedValueOnce({ data: [], error: null });

    await runCommand(batches, { rawArgs: fake.args });
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("No webhook batches found.")
    );
  });

  it("should retrieve batches with undefined limit and offset when not provided", async () => {
    await runCommand(batches, { rawArgs: ["--api-key", "test-api-key"] });

    expect(mockBatches).toHaveBeenCalledWith({
      limit: undefined,
      offset: undefined
    });
  });

  it("should exit with error on API batch retrieval failure", async () => {
    mockBatches.mockResolvedValueOnce({ error: { message: "API Error" } });

    await expect(
      runCommand(batches, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
