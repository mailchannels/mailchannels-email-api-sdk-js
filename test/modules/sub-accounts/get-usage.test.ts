import { describe, expect, it, vi } from "vitest";
import type { MailChannelsClient } from "~/client";
import { SubAccounts } from "~/modules/sub-accounts";
import { ErrorCode } from "~/internal/errors";
import type { SubAccountsUsageResponse } from "~/types/sub-accounts/usage";
import type { SubAccountsUsageApiResponse } from "~/types/sub-accounts/internal";

const fake = {
  validHandle: "validhandle123",
  apiResponse: {
    period_end_date: "2025-04-11",
    period_start_date: "2025-03-12",
    total_usage: 5000,
    monthly_limit: 10000
  } satisfies SubAccountsUsageApiResponse,
  expectedResponse: {
    data: {
      endDate: "2025-04-11",
      startDate: "2025-03-12",
      total: 5000,
      monthlyLimit: 10000
    },
    error: null
  } satisfies SubAccountsUsageResponse
};

describe("getUsage", () => {
  it("should successfully retrieve the usage of a sub-account with a valid handle", async () => {
    const mockClient = {
      get: vi.fn().mockResolvedValueOnce(fake.apiResponse)
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const { data, error } = await subAccounts.getUsage(fake.validHandle);

    expect(data).toStrictEqual(fake.expectedResponse.data);
    expect(error).toBeNull();
    expect(mockClient.get).toHaveBeenCalledWith(`/tx/v1/sub-account/${encodeURIComponent(fake.validHandle)}/usage`, expect.any(Object));
  });

  it("should handle missing billing period dates", async () => {
    const mockClient = {
      get: vi.fn().mockResolvedValueOnce({
        total_usage: fake.apiResponse.total_usage,
        monthly_limit: fake.apiResponse.monthly_limit
      } satisfies SubAccountsUsageApiResponse)
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const { data, error } = await subAccounts.getUsage(fake.validHandle);

    expect(data).toStrictEqual({
      total: fake.expectedResponse.data.total,
      monthlyLimit: fake.expectedResponse.data.monthlyLimit
    });
    expect(error).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });

  it("should contain error when handle is not provided", async () => {
    const mockClient = {
      get: vi.fn()
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const { data, error } = await subAccounts.getUsage("");

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should contain error on api response error", async () => {
    const mockClient = {
      get: vi.fn().mockImplementationOnce(async (url, { onResponseError }) => {
        onResponseError({ response: { status: ErrorCode.NotFound } });
        throw new Error();
      })
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const { data, error } = await subAccounts.getUsage(fake.validHandle);

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });

  it("should handle catch block errors", async () => {
    const mockClient = {
      get: vi.fn().mockRejectedValueOnce(new Error("failure"))
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const { data, error } = await subAccounts.getUsage(fake.validHandle);

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });

  it("should handle catch block with non-Error rejections", async () => {
    const mockClient = {
      get: vi.fn().mockRejectedValueOnce("error")
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const { data, error } = await subAccounts.getUsage(fake.validHandle);

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });
});
