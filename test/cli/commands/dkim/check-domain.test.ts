import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import checkDomain from "~/cli/commands/dkim/check-domain";
import { styleText, toWordsKeys } from "~/cli/utils/shared/style";
import type { DomainsCheckResponse } from "~/types/domains/check";

const fake = {
  args: [
    "--api-key", "test-api-key",
    "--domain", "example.com",
    "--dkim-domain", "example.com",
    "--dkim-private-key", "private-key",
    "--dkim-selector", "mailchannels",
    "--envelope-from-domain", "bounce.example.com",
    "--sender-id", "sender-123"
  ],
  domain: "example.com",
  options: {
    dkim: {
      domain: "example.com",
      privateKey: "private-key",
      selector: "mailchannels"
    },
    envelopeFromDomain: "bounce.example.com",
    senderId: "sender-123"
  },
  response: {
    data: {
      dkim: [
        {
          domain: "example.com",
          selector: "mailchannels",
          verdict: "passed"
        }
      ],
      domainLockdown: { verdict: "passed" },
      senderDomain: {
        a: { verdict: "passed" },
        mx: { verdict: "failed" },
        verdict: "passed"
      },
      spf: {
        spfRecord: "v=spf1 include:example.com ~all",
        verdict: "passed"
      },
      references: ["https://docs.mailchannels.com/email-api/domain-lockdown"]
    },
    error: null
  } satisfies DomainsCheckResponse
};

const mockCheck = vi.fn().mockResolvedValue(fake.response);

const spfVerdictCases = [
  { verdict: "failed", format: "red" },
  { verdict: "none", format: "red" },
  { verdict: "unknown", format: "red" },
  { verdict: "permanent error", format: "red" },
  { verdict: "soft failed", format: "red" },
  { verdict: "temporary error", format: "red" },
  { verdict: "neutral", format: "yellow" },
  { verdict: "unexpected", format: undefined }
] as const;

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Domains: class { check = mockCheck; }
}));

describe("check-domain", () => {
  beforeEach(() => {
    mockCheck.mockReset().mockResolvedValue(fake.response);
    vi.mocked(console.error).mockClear();
    vi.mocked(console.info).mockClear();
    vi.mocked(console.table).mockClear();
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "table").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should check domain authentication with valid arguments", async () => {
    await runCommand(checkDomain, { rawArgs: fake.args });

    expect(mockCheck).toHaveBeenCalledWith(fake.domain, fake.options);
    expect(console.info).toHaveBeenCalledWith("[DKIM] SPF checks:", styleText(["green"], "PASSED"));
    expect(console.info).toHaveBeenCalledWith(
      "[DKIM] Domain Lockdown checks:", styleText(["green"], "PASSED")
    );
    expect(console.info).toHaveBeenCalledWith(
      "[DKIM] Sender Domain checks:", styleText(["green"], "PASSED")
    );
    expect(console.info).toHaveBeenCalledWith(
      "[DKIM] DKIM checks:", styleText(["green"], "PASSED")
    );
    expect(console.table).toHaveBeenNthCalledWith(1, toWordsKeys(fake.response.data.spf));
    expect(console.table).toHaveBeenNthCalledWith(2, toWordsKeys({
      result: fake.response.data.domainLockdown
    }));
    expect(console.table).toHaveBeenNthCalledWith(3, toWordsKeys({
      result: { verdict: fake.response.data.senderDomain.verdict },
      a: fake.response.data.senderDomain.a,
      mx: fake.response.data.senderDomain.mx
    }));
    expect(console.table).toHaveBeenNthCalledWith(4, toWordsKeys(fake.response.data.dkim));
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining("[DKIM] References:"));
  });

  it.each(spfVerdictCases)("should style SPF verdict $verdict", async ({ verdict, format }) => {
    mockCheck.mockResolvedValueOnce({
      data: {
        ...fake.response.data,
        spf: { ...fake.response.data.spf, verdict }
      },
      error: null
    });

    await runCommand(checkDomain, { rawArgs: fake.args });

    const expectedVerdict = format
      ? styleText(format, verdict.toUpperCase())
      : verdict.toUpperCase();

    expect(console.info).toHaveBeenCalledWith("[DKIM] SPF checks:", expectedVerdict);
  });

  it("should fail DKIM when a key fails", async () => {
    mockCheck.mockResolvedValueOnce({
      data: {
        ...fake.response.data,
        dkim: fake.response.data.dkim.map(record => ({ ...record, verdict: "failed" }))
      },
      error: null
    });

    await runCommand(checkDomain, { rawArgs: fake.args });

    expect(console.info).toHaveBeenCalledWith("[DKIM] DKIM checks:", styleText("red", "FAILED"));
  });

  it("should report failed DKIM and omit references when there are no records", async () => {
    mockCheck.mockResolvedValueOnce({
      data: {
        ...fake.response.data,
        dkim: [],
        references: []
      },
      error: null
    });

    await runCommand(checkDomain, { rawArgs: fake.args });

    expect(console.info).toHaveBeenCalledWith("[DKIM] DKIM checks:", styleText("red", "FAILED"));
    expect(console.table).toHaveBeenNthCalledWith(4, []);
    expect(console.info).not.toHaveBeenCalledWith(expect.stringContaining("[DKIM] References:"));
  });

  it("should exit with error when the domain is missing", async () => {
    await expect(
      runCommand(checkDomain, { rawArgs: ["--api-key", "test-api-key"] })
    ).rejects.toThrow();

    expect(mockCheck).not.toHaveBeenCalled();
  });

  it("should exit with error on API check failure", async () => {
    mockCheck.mockResolvedValueOnce({ error: { message: "API Error" } });

    await expect(
      runCommand(checkDomain, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
