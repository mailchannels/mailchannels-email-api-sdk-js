import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import customTracking from "~/cli/commands/custom-tracking";
import type { SuccessResponse } from "~/types/responses";

// @ts-expect-error defineCommand does not handle well sub command types
const deleteCommand = await customTracking.subCommands?.delete;

const fake = {
  args: [
    "--api-key", "test-api-key",
    "--hostname", "click.example.com",
    "--scope", "click"
  ],
  hostname: "click.example.com",
  scope: "click" as const,
  response: {
    success: true,
    error: null
  } satisfies SuccessResponse
};

const mockDelete = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Domains: class { customTracking = { delete: mockDelete }; }
}));

describe("custom-tracking delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should delete a custom tracking domain with valid arguments", async () => {
    await runCommand(deleteCommand, { rawArgs: fake.args });

    expect(mockDelete).toHaveBeenCalledWith(fake.hostname, fake.scope);
    expect(console.info).toHaveBeenCalledWith("[Custom Tracking] Custom tracking domain deleted successfully.");
  });

  it("should exit with error when hostname or scope is missing", async () => {
    await expect(
      runCommand(deleteCommand, { rawArgs: ["--api-key", "test-api-key", "--hostname", fake.hostname] })
    ).rejects.toThrow();

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("should exit with error on API delete failure", async () => {
    mockDelete.mockResolvedValueOnce({ success: false, error: { message: "API Error" } });

    await expect(
      runCommand(deleteCommand, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
