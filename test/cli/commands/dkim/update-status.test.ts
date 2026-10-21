import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import updateStatus from "~/cli/commands/dkim/update-status";
import type { DomainsDkimUpdateStatusOptions } from "~/types/domains/dkim-update-status";
import type { SuccessResponse } from "~/types/responses";

const fake = {
  args: [
    "--api-key", "test-api-key",
    "--domain", "example.com",
    "--selector", "mailchannels",
    "--status", "retired"
  ],
  domain: "example.com",
  options: {
    selector: "mailchannels",
    status: "retired"
  } satisfies DomainsDkimUpdateStatusOptions,
  response: {
    success: true,
    error: null
  } satisfies SuccessResponse
};

const mockUpdateStatus = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Domains: class { dkim = { updateStatus: mockUpdateStatus }; }
}));

describe("update-status", () => {
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

  it("should update a DKIM key status with valid arguments", async () => {
    await runCommand(updateStatus, { rawArgs: fake.args });

    expect(mockUpdateStatus).toHaveBeenCalledWith(fake.domain, fake.options);
  });

  it("should exit with error on API update failure", async () => {
    mockUpdateStatus.mockResolvedValueOnce({ success: false, error: { message: "API Error" } });

    await expect(
      runCommand(updateStatus, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
