import { describe, expect, it, vi } from "vitest";
import type { MailChannelsClient } from "~/client";
import { Domains } from "~/modules/domains";
import { ErrorCode } from "~/internal/errors";
import type { DomainsCheckOptions, DomainsCheckResponse } from "~/types/domains/check";
import type { DomainsCheckApiResponse, DomainsCheckPayload } from "~/types/domains/internal";

const fake = {
  domain: "example.com",
  apiResponse: {
    check_results: {
      spf: {
        verdict: "passed",
        spfRecord: "v=spf1 include:relay.mailchannels.net a mx ~all"
      },
      domain_lockdown: { verdict: "passed" },
      sender_domain: { a: { verdict: "failed" }, mx: { verdict: "passed" }, verdict: "passed" },
      dkim: [{ dkim_domain: "example.com", dkim_key_status: "provided", dkim_selector: "selector", verdict: "passed" }]
    }
  } satisfies DomainsCheckApiResponse,
  expectedResponse: {
    data: {
      spf: {
        verdict: "passed",
        spfRecord: "v=spf1 include:relay.mailchannels.net a mx ~all"
      },
      domainLockdown: { verdict: "passed" },
      senderDomain: { a: { verdict: "failed" }, mx: { verdict: "passed" }, verdict: "passed" },
      dkim: [{ domain: "example.com", keyStatus: "provided", selector: "selector", verdict: "passed" }]
    },
    error: null
  } satisfies DomainsCheckResponse,
  options: {
    dkim: { domain: "example.com", privateKey: "private-key", selector: "selector" },
    senderId: "sender-id",
    envelopeFromDomain: "example.net"
  } satisfies DomainsCheckOptions,
  payload: {
    dkim_settings: [{
      dkim_domain: "example.com",
      dkim_private_key: "private-key",
      dkim_selector: "selector"
    }],
    domain: "example.com",
    sender_id: "sender-id",
    envelope_from_domain: "example.net"
  } satisfies DomainsCheckPayload
};

describe("check", () => {
  it("should successfully check a domain", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValueOnce(fake.apiResponse)
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.check(fake.domain, fake.options);

    expect(data).toStrictEqual(fake.expectedResponse.data);
    expect(error).toBeNull();
    expect(mockClient.post).toHaveBeenCalledWith("/tx/v1/check-domain",
      expect.objectContaining({
        body: fake.payload
      })
    );
  });

  it("should successfully check a domain with dkim as array", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValueOnce(fake.apiResponse)
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.check(fake.domain, {
      ...fake.options,
      dkim: [fake.options.dkim]
    });

    expect(data).toStrictEqual(fake.expectedResponse.data);
    expect(error).toBeNull();
    expect(mockClient.post).toHaveBeenCalled();
  });

  it("should successfully check a domain without dkim settings", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValueOnce(fake.apiResponse)
    } as unknown as MailChannelsClient;

    const options = { ...fake.options };
    // @ts-expect-error testing without dkim settings
    delete options.dkim;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.check(fake.domain, options);

    expect(data).toStrictEqual(fake.expectedResponse.data);
    expect(error).toBeNull();
    expect(mockClient.post).toHaveBeenCalled();
  });

  it("should return error if domain is not provided", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValueOnce(fake.apiResponse)
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.check("", fake.options);

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.post).not.toHaveBeenCalled();
  });

  it("should successfully check a domain with dkim without private key", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValueOnce(fake.apiResponse)
    } as unknown as MailChannelsClient;

    const options = { ...fake.options };
    // @ts-expect-error testing dkim without private key
    delete options.dkim.privateKey;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.check(fake.domain, options);

    expect(data).toStrictEqual(fake.expectedResponse.data);
    expect(error).toBeNull();
    expect(mockClient.post).toHaveBeenCalled();
  });

  it("should contain error when dkim settings exceed 10", async () => {
    const mockClient = { post: vi.fn() } as unknown as MailChannelsClient;
    const domains = new Domains(mockClient);
    const { data, error } = await domains.check(fake.domain, {
      ...fake.options,
      dkim: Array.from({ length: 11 }, () => ({ domain: "example.com", selector: "mailchannels" }))
    });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.post).not.toHaveBeenCalled();
  });

  it("should contain error when dkim setting has privateKey without selector", async () => {
    const mockClient = { post: vi.fn() } as unknown as MailChannelsClient;
    const domains = new Domains(mockClient);
    const { data, error } = await domains.check(fake.domain, {
      ...fake.options,
      dkim: [{ domain: "example.com", privateKey: "private-key" }]
    });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.post).not.toHaveBeenCalled();
  });

  it("should contain error on api response error", async () => {
    const mockClient = {
      post: vi.fn().mockImplementationOnce(async (url, { onResponseError }) => new Promise((_, reject) => {
        onResponseError({ response: { status: ErrorCode.BadRequest } });
        reject();
      }))
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.check(fake.domain, fake.options);

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.post).toHaveBeenCalled();
  });

  it("should handle catch block errors", async () => {
    const mockClient = {
      post: vi.fn().mockRejectedValueOnce(new Error("failure"))
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.check(fake.domain, fake.options);

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.post).toHaveBeenCalled();
  });

  it("should handle catch block with non-Error rejections", async () => {
    const mockClient = {
      post: vi.fn().mockRejectedValueOnce("error")
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.check(fake.domain, fake.options);

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.post).toHaveBeenCalled();
  });
});
