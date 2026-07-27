import { describe, expect, it, vi } from "vitest";
import type { MailChannelsClient } from "~/client";
import { SubAccounts } from "~/modules/sub-accounts";
import { ErrorCode } from "~/internal/errors";
import type { SubAccountsSmtpPasswordsListResponse } from "~/types/sub-accounts/smtp-passwords";
import type { SubAccountsSmtpPasswordsListApiResponse } from "~/types/sub-accounts/internal";

const fake = {
  validHandle: "validhandle123",
  apiResponse: [
    { enabled: true, id: 1, smtp_password: "password-1" },
    { enabled: false, id: 2, smtp_password: "password-2" }
  ] satisfies SubAccountsSmtpPasswordsListApiResponse,
  expectedResponse: {
    data: [
      { enabled: true, id: 1, smtpPassword: "password-1" },
      { enabled: false, id: 2, smtpPassword: "password-2" }
    ],
    error: null
  } satisfies SubAccountsSmtpPasswordsListResponse
};

describe("smtpPasswords.list", () => {
  it("should retrieve a list of SMTP passwords for a handle", async () => {
    const mockClient = {
      get: vi.fn().mockResolvedValueOnce(fake.apiResponse)
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const { data, error } = await subAccounts.smtpPasswords.list(fake.validHandle);

    expect(data).toStrictEqual(fake.expectedResponse.data);
    expect(error).toBeNull();
    expect(mockClient.get).toHaveBeenCalledWith(`/tx/v1/sub-account/${encodeURIComponent(fake.validHandle)}/smtp-password`, expect.any(Object));
  });

  it("should contain error when handle is not provided", async () => {
    const mockClient = {
      get: vi.fn()
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const { data, error } = await subAccounts.smtpPasswords.list("");

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
    const { data, error } = await subAccounts.smtpPasswords.list(fake.validHandle);

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });

  it("should handle catch block errors", async () => {
    const mockClient = {
      get: vi.fn().mockRejectedValueOnce(new Error("failure"))
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const { data, error } = await subAccounts.smtpPasswords.list(fake.validHandle);

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });

  it("should handle catch block with non-Error rejections", async () => {
    const mockClient = {
      get: vi.fn().mockRejectedValueOnce("error")
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const { data, error } = await subAccounts.smtpPasswords.list(fake.validHandle);

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });

  it("should do the same thing as listSmtpPasswords", async () => {
    const mockClient = {
      get: vi.fn().mockResolvedValue(fake.apiResponse)
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const result = await subAccounts.smtpPasswords.list(fake.validHandle);
    const deprecatedResult = await subAccounts.listSmtpPasswords(fake.validHandle);

    expect(result).toStrictEqual(deprecatedResult);
    expect(mockClient.get).toHaveBeenCalledTimes(2);
  });
});
