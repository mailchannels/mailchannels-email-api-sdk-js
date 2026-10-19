import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import customTracking from "~/cli/commands/custom-tracking";
import { tabulatedSections } from "~/cli/utils/shared/sections";
import { styleText } from "~/cli/utils/shared/style";
import type { DomainsCustomTrackingListResponse } from "~/types/domains/custom-tracking-list";

// @ts-expect-error defineCommand does not handle well sub command types
const list = await customTracking.subCommands?.list;

const fake = {
  args: [
    "--api-key", "test-api-key",
    "--name", "clickdemo",
    "--status", "active",
    "--scope", "click",
    "--limit", "25",
    "--offset", "5"
  ],
  options: {
    name: "clickdemo",
    status: "active",
    scope: "click",
    limit: 25,
    offset: 5
  },
  response: {
    data: {
      customTrackingDomains: [
        {
          name: "clickdemo",
          hostname: "click.example.com",
          scope: "click",
          status: "active",
          createdAt: "2026-06-24T00:00:00Z"
        }
      ],
      total: 1
    },
    error: null
  } satisfies DomainsCustomTrackingListResponse
};

const mockList = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Domains: class { customTracking = { list: mockList }; }
}));

describe("custom-tracking list", () => {
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

  it("should list custom tracking domains with filters and pagination", async () => {
    await runCommand(list, { rawArgs: fake.args });

    expect(mockList).toHaveBeenCalledWith(fake.options);
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[Custom Tracking] Retrieved custom tracking domains:"
        + tabulatedSections(fake.response.data.customTrackingDomains)
      )
    );
    expect(console.info).toHaveBeenCalledWith(
      "[Custom Tracking] Total custom tracking domains retrieved:", fake.response.data.customTrackingDomains.length,
      `(with limit: ${styleText("yellow", String(fake.options.limit))}, offset: ${styleText("yellow", String(fake.options.offset))})`
    );
  });

  it("should use default filters and pagination when they are not provided", async () => {
    await runCommand(list, { rawArgs: ["--api-key", "test-api-key"] });

    expect(mockList).toHaveBeenCalledWith({
      name: undefined,
      status: undefined,
      scope: undefined,
      limit: undefined,
      offset: undefined
    });
    expect(console.info).toHaveBeenCalledWith(
      "[Custom Tracking] Total custom tracking domains retrieved:", fake.response.data.customTrackingDomains.length,
      `(with limit: ${styleText("yellow", "100")}, offset: ${styleText("yellow", "0")})`
    );
  });

  it("should report when no custom tracking domains are found", async () => {
    mockList.mockResolvedValueOnce({ data: { customTrackingDomains: [], total: 0 }, error: null });

    await runCommand(list, { rawArgs: fake.args });

    expect(console.info).toHaveBeenCalledWith("[Custom Tracking] No custom tracking domains found.");
  });

  it("should exit with error on API list failure", async () => {
    mockList.mockResolvedValueOnce({ data: null, error: { message: "API Error" } });

    await expect(
      runCommand(list, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
