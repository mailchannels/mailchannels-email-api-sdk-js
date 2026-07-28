import { describe, expect, it, vi } from "vitest";
import type { MailChannelsClient } from "~/client";
import { Domains } from "~/modules/domains";
import { ErrorCode } from "~/internal/errors";
import type { DomainsCustomTrackingListApiResponse } from "~/types/domains/internal";
import type { DomainsCustomTrackingListOptions, DomainsCustomTrackingListResponse } from "~/types/domains/custom-tracking-list";

const fake = {
  options: {
    name: "clickdemo",
    status: "active",
    scope: "click",
    limit: 10,
    offset: 0
  } satisfies DomainsCustomTrackingListOptions,
  apiResponse: {
    custom_tracking_domains: [
      {
        name: "clickdemo",
        hostname: "click.example.com",
        scope: "click",
        status: "active",
        created_at: "2026-06-24T00:00:00Z"
      }
    ],
    total: 1
  } satisfies DomainsCustomTrackingListApiResponse,
  expectedResponse: {
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

describe("customTracking.list", () => {
  it("should successfully list custom tracking domains", async () => {
    const mockClient = {
      get: vi.fn().mockResolvedValueOnce(fake.apiResponse)
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.customTracking.list(fake.options);

    expect(data).toStrictEqual(fake.expectedResponse.data);
    expect(error).toBeNull();
    expect(mockClient.get).toHaveBeenCalledWith("/tx/v1/custom-tracking-domains", expect.objectContaining({
      query: {
        name: fake.options.name,
        status: fake.options.status,
        scope: fake.options.scope,
        limit: fake.options.limit,
        offset: fake.options.offset
      }
    }));
  });

  it("should contain error on api response error", async () => {
    const mockClient = {
      get: vi.fn().mockImplementationOnce(async (url, { onResponseError }) => new Promise((_, reject) => {
        onResponseError({ response: { status: ErrorCode.BadRequest } });
        reject();
      }))
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.customTracking.list();

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });

  it("should contain error if limit is out of range", async () => {
    const mockClient = { get: vi.fn() } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.customTracking.list({ limit: 1001 });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should contain error if offset is negative", async () => {
    const mockClient = { get: vi.fn() } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.customTracking.list({ offset: -10 });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should handle catch block errors", async () => {
    const mockClient = {
      get: vi.fn().mockRejectedValueOnce(new Error("failure"))
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.customTracking.list();

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });

  it("should handle catch block with non-Error rejections", async () => {
    const mockClient = {
      get: vi.fn().mockRejectedValueOnce("error")
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { data, error } = await domains.customTracking.list();

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });
});
