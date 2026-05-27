import { describe, expect, it, vi } from "vitest";
import type { MailChannelsClient } from "~/client";
import { Domains } from "~/modules/domains";
import { ErrorCode } from "~/utils/errors";
import type { DomainsDkimCreateApiResponse } from "~/types/domains/internal";
import type { DomainsDkimCreateResponse } from "~/types/domains/dkim-create";

const fake = {
  options: {
    selector: "mailchannels_test"
  },
  apiResponse: {
    algorithm: "rsa",
    created_at: "2024-07-29T15:51:28.071Z",
    dkim_dns_records: [{
      name: "mailchannels_test._domainkey.example.com",
      type: "TXT",
      value: "string"
    }],
    domain: "example.com",
    key_length: 2048,
    public_key: "string",
    selector: "mailchannels_test",
    status: "active",
    status_modified_at: "2024-07-29T15:51:28.071Z"
  } satisfies DomainsDkimCreateApiResponse,
  expectedResponse: {
    data: {
      algorithm: "rsa",
      createdAt: "2024-07-29T15:51:28.071Z",
      dnsRecords: [{
        name: "mailchannels_test._domainkey.example.com",
        type: "TXT",
        value: "string"
      }],
      domain: "example.com",
      length: 2048,
      publicKey: "string",
      selector: "mailchannels_test",
      status: "active",
      statusModifiedAt: "2024-07-29T15:51:28.071Z"
    },
    error: null
  } satisfies DomainsDkimCreateResponse
};

describe("dkim.create", () => {
  it("should successfully create a DKIM key", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValueOnce(fake.apiResponse)
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.dkim.create("example.com", fake.options);

    expect(data).toStrictEqual(fake.expectedResponse.data);
    expect(error).toBeNull();
    expect(mockClient.post).toHaveBeenCalled();
  });

  it("should return error if domain is not provided", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValueOnce(fake.apiResponse)
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.dkim.create("", fake.options);

    expect(error).toStrictEqual({
      message: "No domain provided.",
      statusCode: null
    });
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
    const { data, error } = await domains.dkim.create("example.com", fake.options);

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.post).toHaveBeenCalled();
  });

  it("should return error if selector is too long", async () => {
    const mockClient = { post: vi.fn() } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.dkim.create("example.com", { selector: "a".repeat(64) });

    expect(error).toStrictEqual({ message: "Selector must be between 1 and 63 characters.", statusCode: null });
    expect(data).toBeNull();
    expect(mockClient.post).not.toHaveBeenCalled();
  });

  it("should return error if no selector is provided", async () => {
    const mockClient = { post: vi.fn() } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.dkim.create("example.com", { selector: "" });

    expect(error).toStrictEqual({ message: "Selector must be between 1 and 63 characters.", statusCode: null });
    expect(data).toBeNull();
    expect(mockClient.post).not.toHaveBeenCalled();
  });

  it("should handle catch block errors", async () => {
    const mockClient = {
      post: vi.fn().mockRejectedValueOnce(new Error("failure"))
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.dkim.create("example.com", fake.options);

    expect(error).toStrictEqual({ message: "failure", statusCode: null });
    expect(data).toBeNull();
    expect(mockClient.post).toHaveBeenCalled();
  });

  it("should handle catch block with non-Error rejections", async () => {
    const mockClient = {
      post: vi.fn().mockRejectedValueOnce("error")
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.dkim.create("example.com", fake.options);

    expect(error).toStrictEqual({ message: "Failed to create DKIM key.", statusCode: null });
    expect(data).toBeNull();
    expect(mockClient.post).toHaveBeenCalled();
  });
});
