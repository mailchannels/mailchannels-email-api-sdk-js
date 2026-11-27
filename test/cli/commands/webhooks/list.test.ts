import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import list from "~/cli/commands/webhooks/list";
import type { WebhooksListResponse } from "~/types/webhooks/list";

const webhook = "https://example.com/webhook";
const fake = {
  args: ["--api-key", "test-api-key"],
  webhook,
  response: {
    data: [{ webhook }],
    error: null
  } satisfies WebhooksListResponse
};

const mockList = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Webhooks: class { list = mockList; }
}));

describe("list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockClear();
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "table").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should list registered webhooks with valid arguments", async () => {
    await runCommand(list, { rawArgs: fake.args });

    expect(mockList).toHaveBeenCalledWith();
    expect(console.table).toHaveBeenCalledWith([{ Webhook: fake.webhook }]);
  });

  it("should display the failure threshold when configured", async () => {
    mockList.mockResolvedValueOnce({
      data: [{ webhook: fake.webhook, failureThreshold: 1 }],
      error: null
    });

    await runCommand(list, { rawArgs: fake.args });

    expect(console.table).toHaveBeenCalledWith([
      { "Webhook": fake.webhook, "Failure Threshold": 1 }
    ]);
  });

  it("should report when no webhooks are registered", async () => {
    mockList.mockResolvedValueOnce({ data: [], error: null });

    await runCommand(list, { rawArgs: fake.args });
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("No registered webhooks found.")
    );
  });

  it("should exit with error on API list failure", async () => {
    mockList.mockResolvedValueOnce({ error: { message: "API Error" } });

    await expect(
      runCommand(list, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
