import { describe, expect, it, vi } from "vitest";
import type { MailChannelsClient } from "~/client";
import { Domains } from "~/modules/domains";
import { ErrorCode } from "~/internal/errors";
import type { DomainsCustomTrackingDnsSetupRequiredApiResponse, DomainsCustomTrackingDomainApiResponse } from "~/types/domains/internal";
import type { DomainsCustomTrackingWithDnsSetupRequired } from "~/types/domains/custom-tracking-create";

const fake = {
  name: "clickdemo",
  hostname: "click.example.com",
  scope: "click" as const,
  expectedResponseCreated: {
    dnsSetupRequired: false,
    name: "clickdemo",
    hostname: "click.example.com",
    scope: "click",
    status: "active",
    createdAt: "2026-06-24T00:00:00Z"
  } satisfies DomainsCustomTrackingWithDnsSetupRequired<201>,
  expectedResponseDnsSetupRequired: {
    dnsSetupRequired: true,
    token: "550e8400-e29b-41d4-a716-446655440000",
    txtRecordName: "_mailchannels-verify.click.example.com",
    txtRecordValue: "550e8400-e29b-41d4-a716-446655440000",
    instructions: "Add this TXT record"
  } satisfies DomainsCustomTrackingWithDnsSetupRequired<202>,
  apiResponseCreated: {
    name: "clickdemo",
    hostname: "click.example.com",
    scope: "click",
    status: "active",
    created_at: "2026-06-24T00:00:00Z"
  } satisfies DomainsCustomTrackingDomainApiResponse,
  apiResponsePending: {
    token: "550e8400-e29b-41d4-a716-446655440000",
    txt_record_name: "_mailchannels-verify.click.example.com",
    txt_record_value: "550e8400-e29b-41d4-a716-446655440000",
    instructions: "Add this TXT record"
  } satisfies DomainsCustomTrackingDnsSetupRequiredApiResponse
};

describe("customTracking.create", () => {
  it("should successfully create and return custom tracking domain", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValueOnce(fake.apiResponseCreated)
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.customTracking.create(fake.name, fake.hostname, fake.scope);

    expect(data).toStrictEqual(fake.expectedResponseCreated);
    expect(error).toBeNull();
    expect(mockClient.post).toHaveBeenCalledWith("/tx/v1/custom-tracking-domains",
      expect.objectContaining({
        body: {
          name: fake.name,
          hostname: fake.hostname,
          scope: fake.scope
        }
      }));
  });

  it("should successfully return verification pending", async () => {
    const mockClient = {
      post: vi.fn().mockImplementationOnce(async (url, { onResponse }) => {
        onResponse({ response: { status: 202 } });
        return fake.apiResponsePending;
      })
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.customTracking.create(fake.name, fake.hostname, fake.scope);

    expect(data).toStrictEqual(fake.expectedResponseDnsSetupRequired);
    expect(error).toBeNull();
    expect(mockClient.post).toHaveBeenCalled();
  });

  it("should contain error if name is invalid", async () => {
    const mockClient = { post: vi.fn() } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.customTracking.create("invalid name with spaces", fake.hostname, fake.scope);

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.post).not.toHaveBeenCalled();
  });

  it("should contain error if hostname is missing", async () => {
    const mockClient = { post: vi.fn() } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.customTracking.create(fake.name, "", fake.scope);

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.post).not.toHaveBeenCalled();
  });

  it("should contain error if scope is invalid", async () => {
    const mockClient = { post: vi.fn() } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    // @ts-expect-error Testing invalid scope
    const { data, error } = await domains.customTracking.create(fake.name, fake.hostname, "invalid-scope");

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
    const { data, error } = await domains.customTracking.create(fake.name, fake.hostname, fake.scope);

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.post).toHaveBeenCalled();
  });
});
