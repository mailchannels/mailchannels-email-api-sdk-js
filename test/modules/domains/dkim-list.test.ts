import { describe, expect, it, vi } from "vitest";
import type { MailChannelsClient } from "~/client";
import { Domains } from "~/modules/domains";
import { ErrorCode } from "~/internal/errors";
import type { DomainsDkimCreateApiResponse } from "~/types/domains/internal";
import type { DomainsDkimCreateResponse } from "~/types/domains/dkim-create";

const fake = {
  apiResponse: {
    algorithm: "rsa",
    created_at: "2024-07-29T15:51:28.071Z",
    dkim_dns_records: [{
      name: "mailchannels-test._domainkey.example.com",
      type: "TXT",
      value: "string"
    }],
    domain: "example.com",
    key_length: 2048,
    public_key: "string",
    selector: "mailchannels-test",
    status: "active",
    status_modified_at: "2024-07-29T15:51:28.071Z"
  } satisfies DomainsDkimCreateApiResponse,
  expectedResponse: {
    data: {
      algorithm: "rsa",
      createdAt: "2024-07-29T15:51:28.071Z",
      dnsRecords: [{
        name: "mailchannels-test._domainkey.example.com",
        type: "TXT",
        value: "string"
      }],
      domain: "example.com",
      length: 2048,
      publicKey: "string",
      selector: "mailchannels-test",
      status: "active",
      statusModifiedAt: "2024-07-29T15:51:28.071Z"
    },
    error: null
  } satisfies DomainsDkimCreateResponse
};

describe("dkim.list", () => {
  it("should successfully get DKIM keys", async () => {
    const mockClient = {
      get: vi.fn().mockResolvedValueOnce({ keys: [fake.apiResponse] })
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.dkim.list("example.com", { includeDnsRecord: true });

    expect(data).toStrictEqual([fake.expectedResponse.data]);
    expect(error).toBeNull();
    expect(mockClient.get).toHaveBeenCalledWith("/tx/v1/domains/example.com/dkim-keys",
      expect.objectContaining({
        query: {
          include_dns_record: true
        }
      })
    );
  });

  it("should return error if domain is not provided", async () => {
    const mockClient = { get: vi.fn() } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.dkim.list("", { includeDnsRecord: true });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should contain error on api response error", async () => {
    const mockClient = {
      get: vi.fn().mockImplementationOnce(async (url, { onResponseError }) => new Promise((_, reject) => {
        onResponseError({ response: { status: ErrorCode.BadRequest } });
        reject();
      }))
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.dkim.list("example.com", { includeDnsRecord: true });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });

  it("should return error if selector is too long", async () => {
    const mockClient = { get: vi.fn() } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.dkim.list("example.com", { selector: "a".repeat(64) });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should return error if limit is out of range", async () => {
    const mockClient = { get: vi.fn() } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.dkim.list("example.com", { limit: 101 });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should return error if offset is negative", async () => {
    const mockClient = { get: vi.fn() } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.dkim.list("example.com", { offset: -10 });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should handle catch block errors", async () => {
    const mockClient = {
      get: vi.fn().mockRejectedValueOnce(new Error("failure"))
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.dkim.list("example.com");

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });

  it("should handle catch block with non-Error rejections", async () => {
    const mockClient = {
      get: vi.fn().mockRejectedValueOnce("error")
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.dkim.list("example.com");

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });
});
