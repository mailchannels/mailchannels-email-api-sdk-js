import { describe, expect, it, vi } from "vitest";
import type { MailChannelsClient } from "~/client";
import { SubAccounts } from "~/modules/sub-accounts";
import type { SubAccountsApiKeysCreateResponse } from "~/types/sub-accounts/api-keys";
import type { SubAccountsApiKeysCreateApiResponse } from "~/types/sub-accounts/internal";
import { ErrorCode } from "~/internal/errors";

const fake = {
  validHandle: "validhandle123",
  apiResponse: { id: 1, key: "api-key-value" } satisfies SubAccountsApiKeysCreateApiResponse,
  expectedResponse: {
    data: { id: 1, key: "api-key-value" },
    error: null
  } satisfies SubAccountsApiKeysCreateResponse
};

describe("apiKeys.create", () => {
  it("should successfully create an API key for a valid sub-account handle", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValueOnce(fake.apiResponse)
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const result = await subAccounts.apiKeys.create(fake.validHandle);

    expect(result).toStrictEqual(fake.expectedResponse);
    expect(mockClient.post).toHaveBeenCalledWith(`/tx/v1/sub-account/${encodeURIComponent(fake.validHandle)}/api-key`, expect.any(Object));
  });

  it("should contain error when handle is not provided", async () => {
    const mockClient = {
      post: vi.fn()
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const { data, error } = await subAccounts.apiKeys.create("");

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.post).not.toHaveBeenCalled();
  });

  it("should contain error on api response error", async () => {
    const mockClient = {
      post: vi.fn().mockImplementationOnce(async (url, { onResponseError }) => {
        onResponseError({ response: { status: ErrorCode.Forbidden } });
        throw new Error();
      })
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const { data, error } = await subAccounts.apiKeys.create(fake.validHandle);

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.post).toHaveBeenCalled();
  });

  it("should handle catch block errors", async () => {
    const mockClient = {
      post: vi.fn().mockRejectedValueOnce(new Error("failure"))
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const { data, error } = await subAccounts.apiKeys.create(fake.validHandle);

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.post).toHaveBeenCalled();
  });

  it("should handle catch block with non-Error rejections", async () => {
    const mockClient = {
      post: vi.fn().mockRejectedValueOnce("error")
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const { data, error } = await subAccounts.apiKeys.create(fake.validHandle);

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.post).toHaveBeenCalled();
  });

  it("should do the same thing as createApiKey", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue(fake.apiResponse)
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const result = await subAccounts.apiKeys.create(fake.validHandle);
    const deprecatedResult = await subAccounts.createApiKey(fake.validHandle);

    expect(result).toStrictEqual(deprecatedResult);
    expect(mockClient.post).toHaveBeenCalledTimes(2);
  });
});
