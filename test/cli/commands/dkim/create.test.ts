import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import create from "~/cli/commands/dkim/create";
import { tabulatedSections } from "~/cli/utils/shared/sections";
import type { DomainsDkimCreateResponse } from "~/types/domains/dkim-create";

const fake = {
  args: [
    "--api-key", "test-api-key",
    "--domain", "example.com",
    "--selector", "mailchannels",
    "--algorithm", "rsa",
    "--length", "2048"
  ],
  domain: "example.com",
  options: {
    selector: "mailchannels",
    algorithm: "rsa",
    length: 2048
  },
  response: {
    data: {
      algorithm: "rsa",
      dnsRecords: [{
        name: "mailchannels._domainkey.example.com",
        type: "TXT",
        value: "public-key"
      }],
      domain: "example.com",
      length: 2048,
      publicKey: "public-key",
      selector: "mailchannels",
      status: "active"
    },
    error: null
  } satisfies DomainsDkimCreateResponse
};

const { dnsRecords, ...dkimData } = fake.response.data;

const mockCreate = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Domains: class { dkim = { create: mockCreate }; }
}));

describe("create", () => {
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

  it("should create a DKIM key with valid arguments", async () => {
    await runCommand(create, { rawArgs: fake.args });

    expect(mockCreate).toHaveBeenCalledWith(fake.domain, fake.options);
  });

  it("should omit key length when --length is not provided", async () => {
    await runCommand(create, {
      rawArgs: [
        "--api-key", "test-api-key",
        "--domain", "example.com",
        "--selector", "mailchannels",
        "--algorithm", "rsa"
      ]
    });

    expect(mockCreate).toHaveBeenCalledWith(fake.domain, {
      selector: fake.options.selector,
      algorithm: fake.options.algorithm,
      length: undefined
    });
  });

  it("should print DNS records when the response includes them", async () => {
    mockCreate.mockResolvedValueOnce(fake.response);
    vi.mocked(console.info).mockClear();

    await runCommand(create, { rawArgs: fake.args });

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[DKIM] DKIM key created successfully:"
        + tabulatedSections(dkimData)
      )
    );
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[DKIM] DNS Records:"
        + tabulatedSections(dnsRecords)
      )
    );
  });

  it("should omit DNS output when the response has no DNS records", async () => {
    mockCreate.mockResolvedValueOnce({
      data: { ...fake.response.data, dnsRecords: [] },
      error: null
    });
    vi.mocked(console.info).mockClear();

    await runCommand(create, { rawArgs: fake.args });

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[DKIM] DKIM key created successfully:"
        + tabulatedSections(dkimData)
      )
    );
    expect(console.info).not.toHaveBeenCalledWith(
      expect.stringContaining("[DKIM] DNS Records:")
    );
  });

  it("should exit with error on API create failure", async () => {
    mockCreate.mockResolvedValueOnce({ error: { message: "API Error" } });

    await expect(
      runCommand(create, { rawArgs: fake.args })
    ).rejects.toThrow();
  });

  it("should exit with error when required arguments are missing", async () => {
    await expect(
      runCommand(create, { rawArgs: ["--api-key", "test-api-key", "--domain", "example.com"] })
    ).rejects.toThrow();

    expect(mockCreate).not.toHaveBeenCalled();
  });
});
