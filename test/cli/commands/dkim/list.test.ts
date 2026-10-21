import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import list from "~/cli/commands/dkim/list";
import { tabulatedSections } from "~/cli/utils/shared/sections";
import { styleText } from "~/cli/utils/shared/style";
import type { DomainsDkimListResponse } from "~/types/domains/dkim-list";

const fake = {
  args: [
    "--api-key", "test-api-key",
    "--domain", "example.com",
    "--selector", "mailchannels",
    "--status", "active",
    "--include-dns-record",
    "--limit", "20",
    "--offset", "5"
  ],
  domain: "example.com",
  options: {
    selector: "mailchannels",
    status: "active",
    includeDnsRecord: true,
    limit: 20,
    offset: 5
  },
  response: {
    data: [{
      algorithm: "rsa",
      domain: "example.com",
      length: 2048,
      publicKey: "public-key",
      selector: "mailchannels",
      status: "active"
    }],
    error: null
  } satisfies DomainsDkimListResponse
};

const mockList = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Domains: class { dkim = { list: mockList }; }
}));

describe("list", () => {
  beforeEach(() => {
    mockList.mockClear();
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should list DKIM keys with valid arguments", async () => {
    await runCommand(list, { rawArgs: fake.args });

    expect(mockList).toHaveBeenCalledWith(fake.domain, fake.options);
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[DKIM] Retrieved DKIM keys:"
        + tabulatedSections(fake.response.data)
      )
    );
    expect(console.info).toHaveBeenCalledWith(
      "[DKIM] Total DKIM keys retrieved:",
      fake.response.data.length,
      `(with limit: ${styleText("yellow", String(fake.options.limit))}, offset: ${styleText("yellow", String(fake.options.offset))})`
    );
  });

  it("should use default pagination when limits are omitted", async () => {
    await runCommand(list, {
      rawArgs: ["--api-key", "test-api-key", "--domain", fake.domain]
    });

    expect(mockList).toHaveBeenCalledWith(fake.domain, {
      selector: undefined,
      status: undefined,
      includeDnsRecord: undefined,
      limit: undefined,
      offset: undefined
    });
    expect(console.info).toHaveBeenCalledWith(
      "[DKIM] Total DKIM keys retrieved:",
      fake.response.data.length,
      `(with limit: ${styleText("yellow", "10")}, offset: ${styleText("yellow", "0")})`
    );
  });

  it("should report when no DKIM keys are found", async () => {
    mockList.mockResolvedValueOnce({ data: [], error: null });

    await runCommand(list, {
      rawArgs: ["--api-key", "test-api-key", "--domain", fake.domain]
    });

    expect(console.info).toHaveBeenCalledWith("[DKIM] No DKIM keys found.");
  });

  it("should exit with error on API list failure", async () => {
    mockList.mockResolvedValueOnce({ error: { message: "API Error" } });

    await expect(
      runCommand(list, { rawArgs: fake.args })
    ).rejects.toThrow();
  });

  it("should exit with error when the domain is missing", async () => {
    await expect(
      runCommand(list, { rawArgs: ["--api-key", "test-api-key"] })
    ).rejects.toThrow();

    expect(mockList).not.toHaveBeenCalled();
  });
});
