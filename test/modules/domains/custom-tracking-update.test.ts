import { describe, expect, it, vi } from "vitest";
import type { MailChannelsClient } from "~/client";
import { Domains } from "~/modules/domains";
import { ErrorCode } from "~/utils/errors";
import type { DomainsCustomTrackingDnsSetupRequiredApiResponse, DomainsCustomTrackingDomainApiResponse } from "~/types/domains/internal";
import type { DomainsCustomTrackingScope, DomainsCustomTrackingWithDnsSetupRequired } from "~/types/domains/custom-tracking-create";
import type { DomainsCustomTrackingUpdateOptions } from "~/types/domains/custom-tracking-update";

const fake = {
  hostname: "open.example.com",
  scope: "open" as DomainsCustomTrackingScope,
  options: {
    name: "new-label",
    status: "active"
  } satisfies DomainsCustomTrackingUpdateOptions,
  expectedResponseUpdated: {
    dnsSetupRequired: false,
    name: "new-label",
    hostname: "open.example.com",
    scope: "open",
    status: "active",
    createdAt: "2026-06-24T00:00:00Z"
  } satisfies DomainsCustomTrackingWithDnsSetupRequired<200>,
  expectedResponseDnsSetupRequired: {
    dnsSetupRequired: true,
    token: "550e8400-e29b-41d4-a716-446655440000",
    txtRecordName: "_mailchannels-verify.open.example.com",
    txtRecordValue: "550e8400-e29b-41d4-a716-446655440000",
    instructions: "Add this TXT record"
  } satisfies DomainsCustomTrackingWithDnsSetupRequired<202>,
  apiResponseUpdated: {
    name: "new-label",
    hostname: "open.example.com",
    scope: "open",
    status: "active",
    created_at: "2026-06-24T00:00:00Z"
  } satisfies DomainsCustomTrackingDomainApiResponse,
  apiResponsePending: {
    token: "550e8400-e29b-41d4-a716-446655440000",
    txt_record_name: "_mailchannels-verify.open.example.com",
    txt_record_value: "550e8400-e29b-41d4-a716-446655440000",
    instructions: "Add this TXT record"
  } satisfies DomainsCustomTrackingDnsSetupRequiredApiResponse
};

describe("customTracking.update", () => {
  it("should successfully update and return domain", async () => {
    const mockClient = {
      patch: vi.fn().mockResolvedValueOnce(fake.apiResponseUpdated)
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.customTracking.update(fake.hostname, fake.scope, fake.options);

    expect(data).toStrictEqual(fake.expectedResponseUpdated);
    expect(error).toBeNull();
    expect(mockClient.patch).toHaveBeenCalledWith(`/tx/v1/custom-tracking-domains/${encodeURIComponent(fake.hostname)}/${encodeURIComponent(fake.scope)}`,
      expect.objectContaining({
        body: {
          name: fake.options.name,
          status: fake.options.status
        }
      }));
  });

  it("should successfully return verification pending", async () => {
    const mockClient = {
      patch: vi.fn().mockImplementationOnce(async (url, { onResponse }) => {
        onResponse({ response: { status: 202 } });
        return fake.apiResponsePending;
      })
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.customTracking.update(fake.hostname, fake.scope, fake.options);

    expect(data).toStrictEqual(fake.expectedResponseDnsSetupRequired);
    expect(error).toBeNull();
    expect(mockClient.patch).toHaveBeenCalled();
  });

  it("should allow updating status without providing name", async () => {
    const mockClient = {
      patch: vi.fn().mockResolvedValueOnce(fake.apiResponseUpdated)
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.customTracking.update(fake.hostname, fake.scope, { status: "active" });

    expect(data).toStrictEqual(fake.expectedResponseUpdated);
    expect(error).toBeNull();
    expect(mockClient.patch).toHaveBeenCalled();
  });

  it("should contain error for missing hostname", async () => {
    const mockClient = { patch: vi.fn() } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.customTracking.update("", fake.scope, fake.options);

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.patch).not.toHaveBeenCalled();
  });

  it("should contain error if name is invalid", async () => {
    const mockClient = { patch: vi.fn() } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.customTracking.update(fake.hostname, fake.scope, {
      ...fake.options,
      name: "invalid name with spaces"
    });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.patch).not.toHaveBeenCalled();
  });

  it("should contain error if scope is invalid", async () => {
    const mockClient = { patch: vi.fn() } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    // @ts-expect-error Testing invalid scope
    const { data, error } = await domains.customTracking.update(fake.hostname, "invalid-scope", fake.options);

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.patch).not.toHaveBeenCalled();
  });

  it("should contain error if either name or status is not provided", async () => {
    const mockClient = { patch: vi.fn() } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.customTracking.update(fake.hostname, fake.scope, {});

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.patch).not.toHaveBeenCalled();
  });

  it("should contain error on api response error", async () => {
    const mockClient = {
      patch: vi.fn().mockImplementationOnce(async (url, { onResponseError }) => new Promise((_, reject) => {
        onResponseError({ response: { status: ErrorCode.BadRequest } });
        reject();
      }))
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.customTracking.update(fake.hostname, fake.scope, fake.options);

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.patch).toHaveBeenCalled();
  });
});
