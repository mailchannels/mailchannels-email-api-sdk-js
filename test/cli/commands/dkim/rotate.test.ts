import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import rotate from "~/cli/commands/dkim/rotate";
import type { DomainsDkimRotateResponse } from "~/types/domains/dkim-rotate";

const fake = {
  args: [
    "--api-key", "test-api-key",
    "--domain", "example.com",
    "--selector", "old-selector",
    "--new-selector", "new-selector"
  ],
  domain: "example.com",
  selector: "old-selector",
  options: {
    newKey: {
      selector: "new-selector"
    }
  },
  response: {
    data: {
      new: {
        algorithm: "rsa",
        dnsRecords: [{ name: "new-selector._domainkey.example.com", type: "TXT", value: "new-public-key" }],
        domain: "example.com",
        length: 2048,
        publicKey: "new-public-key",
        selector: "new-selector",
        status: "active"
      },
      rotated: {
        algorithm: "rsa",
        dnsRecords: [{ name: "old-selector._domainkey.example.com", type: "TXT", value: "old-public-key" }],
        domain: "example.com",
        length: 2048,
        publicKey: "old-public-key",
        selector: "old-selector",
        status: "rotated"
      }
    },
    error: null
  } satisfies DomainsDkimRotateResponse
};

const mockRotate = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Domains: class { dkim = { rotate: mockRotate }; }
}));

describe("rotate", () => {
  beforeEach(() => {
    mockRotate.mockClear();
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should rotate a DKIM key with valid arguments", async () => {
    await runCommand(rotate, { rawArgs: fake.args });

    expect(mockRotate).toHaveBeenCalledWith(fake.domain, fake.selector, fake.options);
  });

  it("should omit DNS output when the new key has no DNS records", async () => {
    mockRotate.mockResolvedValueOnce({
      data: {
        ...fake.response.data,
        new: { ...fake.response.data.new, dnsRecords: [] }
      },
      error: null
    });
    vi.mocked(console.info).mockClear();

    await runCommand(rotate, { rawArgs: fake.args });

    expect(console.info).toHaveBeenCalledWith("[DKIM] DKIM key rotated successfully.");
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[DKIM] New DKIM key details:")
    );
    expect(console.info).not.toHaveBeenCalledWith(
      expect.stringContaining("[DKIM] DNS Records for the new key:")
    );
  });

  it("should exit with error on API rotate failure", async () => {
    mockRotate.mockResolvedValueOnce({ error: { message: "API Error" } });

    await expect(
      runCommand(rotate, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
