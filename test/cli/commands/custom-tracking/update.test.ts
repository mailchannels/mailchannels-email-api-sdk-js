import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import customTracking from "~/cli/commands/custom-tracking";
import { tabulatedSections } from "~/cli/utils/shared/sections";
import { styleText } from "~/cli/utils/shared/style";
import type { DomainsCustomTrackingUpdateResponse } from "~/types/domains/custom-tracking-update";

// @ts-expect-error defineCommand does not handle well sub command types
const update = await customTracking.subCommands?.update;

const fake = {
  args: [
    "--api-key", "test-api-key",
    "--hostname", "click.example.com",
    "--scope", "click",
    "--name", "click-links",
    "--status", "disabled"
  ],
  hostname: "click.example.com",
  scope: "click" as const,
  options: {
    name: "click-links",
    status: "disabled" as const
  },
  response: {
    data: {
      dnsSetupRequired: false,
      name: "click-links",
      hostname: "click.example.com",
      scope: "click",
      status: "disabled",
      createdAt: "2026-06-24T00:00:00Z"
    },
    error: null
  } satisfies DomainsCustomTrackingUpdateResponse
};

const mockUpdate = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Domains: class { customTracking = { update: mockUpdate }; }
}));

describe("custom-tracking update", () => {
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

  it("should update a custom tracking domain with valid arguments", async () => {
    await runCommand(update, { rawArgs: fake.args });

    expect(mockUpdate).toHaveBeenCalledWith(fake.hostname, fake.scope, fake.options);
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[Custom Tracking] Custom tracking domain updated successfully:"
        + tabulatedSections(fake.response.data)
      )
    );
  });

  it("should allow updating status without a new name", async () => {
    await runCommand(update, {
      rawArgs: ["--api-key", "test-api-key", "--hostname", fake.hostname, "--scope", fake.scope, "--status", "active"]
    });

    expect(mockUpdate).toHaveBeenCalledWith(fake.hostname, fake.scope, {
      name: undefined,
      status: "active"
    });
  });

  it("should exit with error when hostname or scope is missing", async () => {
    await expect(
      runCommand(update, { rawArgs: ["--api-key", "test-api-key", "--hostname", fake.hostname] })
    ).rejects.toThrow();

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("should exit with error on API update failure", async () => {
    mockUpdate.mockResolvedValueOnce({ data: null, error: { message: "API Error" } });

    await expect(
      runCommand(update, { rawArgs: fake.args })
    ).rejects.toThrow();
  });

  it("should print DNS instructions included in an error response", async () => {
    const instructions = "Add the required TXT and CNAME records";
    mockUpdate.mockResolvedValueOnce({
      data: null,
      error: {
        message: "DNS verification incomplete",
        statusCode: 422,
        type: "unprocessable_entity_error",
        response: { instructions }
      }
    } satisfies DomainsCustomTrackingUpdateResponse);

    await expect(
      runCommand(update, { rawArgs: fake.args })
    ).rejects.toThrow();

    expect(console.info).toHaveBeenCalledWith(
      `[Custom Tracking] Instructions: ${styleText("yellow", instructions)}`
    );
  });
});
