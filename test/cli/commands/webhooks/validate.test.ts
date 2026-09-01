import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import webhooks from "~/cli/commands/webhooks";
import type { WebhooksValidateResponse } from "~/types/webhooks/validate";

// @ts-expect-error defineCommand does not handle well sub command types
const validate = await webhooks.subCommands?.validate;

const fake = {
  args: [
    "--api-key", "test-api-key",
    "--request-id", "request-123"
  ],
  response: {
    data: {
      allPassed: true,
      results: [
        {
          result: "passed",
          webhook: "https://example.com/webhook",
          response: { status: 204 }
        },
        {
          result: "passed",
          webhook: "https://example.org/webhook",
          response: { status: 200 }
        }
      ]
    },
    error: null
  } satisfies WebhooksValidateResponse
};

const mockValidate = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Webhooks: class { validate = mockValidate; }
}));

describe("validate", () => {
  beforeEach(() => {
    mockValidate.mockClear();
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "table").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should validate webhooks", async () => {
    await runCommand(validate, { rawArgs: fake.args });

    expect(mockValidate).toHaveBeenCalledWith("request-123");
    expect(console.table).toHaveBeenCalledWith([
      {
        result: "passed",
        webhook: "https://example.com/webhook",
        status: 204
      },
      {
        result: "passed",
        webhook: "https://example.org/webhook",
        status: 200
      }
    ]);
  });

  it("should exit with error on API validation failure", async () => {
    mockValidate.mockResolvedValueOnce({ error: { message: "API Error" } });

    await expect(
      runCommand(validate, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
