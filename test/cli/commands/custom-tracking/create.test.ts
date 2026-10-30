import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import customTracking from "~/cli/commands/custom-tracking";
import { tabulatedSections } from "~/cli/utils/shared/sections";
import { styleText } from "~/cli/utils/shared/style";
import type { DomainsCustomTrackingCreateResponse } from "~/types/domains/custom-tracking-create";

// @ts-expect-error defineCommand does not handle well sub command types
const create = await customTracking.subCommands?.create;

const fake = {
  args: [
    "--api-key", "test-api-key",
    "--name", "clickdemo",
    "--hostname", "click.example.com",
    "--scope", "click"
  ],
  name: "clickdemo",
  hostname: "click.example.com",
  scope: "click" as const,
  response: {
    data: {
      dnsSetupRequired: false,
      name: "clickdemo",
      hostname: "click.example.com",
      scope: "click",
      status: "active",
      createdAt: "2026-10-15T00:00:00Z"
    },
    error: null
  } satisfies DomainsCustomTrackingCreateResponse
};

const mockCreate = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Domains: class { customTracking = { create: mockCreate }; }
}));

describe("custom-tracking create", () => {
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

  it("should create a custom tracking domain with valid arguments", async () => {
    await runCommand(create, { rawArgs: fake.args });

    expect(mockCreate).toHaveBeenCalledWith(fake.name, fake.hostname, fake.scope);
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[Custom Tracking] Custom tracking domain created successfully:"
        + tabulatedSections(fake.response.data)
      )
    );
  });

  it("should print DNS verification details when setup is required", async () => {
    const response = {
      data: {
        dnsSetupRequired: true,
        token: "550e8400-e29b-41d4-a716-446655440000",
        txtRecordName: "_mailchannels-verify.click.example.com",
        txtRecordValue: "550e8400-e29b-41d4-a716-446655440000",
        instructions: "Add this TXT record"
      },
      error: null
    } satisfies DomainsCustomTrackingCreateResponse;
    mockCreate.mockResolvedValueOnce(response);

    await runCommand(create, { rawArgs: fake.args });

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[Custom Tracking] DNS setup required to complete domain creation."
        + tabulatedSections(response.data))
    );
  });

  it("should exit with error when required arguments are missing", async () => {
    await expect(
      runCommand(create, {
        rawArgs: [
          "--api-key",
          "test-api-key",
          "--hostname",
          fake.hostname,
          "--scope",
          fake.scope
        ]
      })
    ).rejects.toThrow();

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("should exit with error on API create failure", async () => {
    mockCreate.mockResolvedValueOnce({ data: null, error: { message: "API Error" } });

    await expect(
      runCommand(create, { rawArgs: fake.args })
    ).rejects.toThrow();
  });

  it("should not print DNS instructions when the error response has none", async () => {
    mockCreate.mockResolvedValueOnce({
      data: null,
      error: {
        message: "API Error",
        statusCode: 400,
        type: "invalid_request_error",
        response: null
      }
    } satisfies DomainsCustomTrackingCreateResponse);

    await expect(
      runCommand(create, { rawArgs: fake.args })
    ).rejects.toThrow();

    expect(console.info).not.toHaveBeenCalled();
  });

  it("should print DNS instructions included in an error response", async () => {
    const instructions = "Add the required TXT and CNAME records";
    mockCreate.mockResolvedValueOnce({
      data: null,
      error: {
        message: "DNS verification incomplete",
        statusCode: 422,
        type: "unprocessable_entity_error",
        response: { instructions }
      }
    } satisfies DomainsCustomTrackingCreateResponse);

    await expect(
      runCommand(create, { rawArgs: fake.args })
    ).rejects.toThrow();

    expect(console.info).toHaveBeenCalledWith(
      `[Custom Tracking] Instructions: ${styleText("yellow", instructions)}`
    );
  });
});
