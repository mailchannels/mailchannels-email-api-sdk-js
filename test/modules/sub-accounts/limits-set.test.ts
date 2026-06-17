import { describe, expect, it, vi } from "vitest";
import type { MailChannelsClient } from "~/client";
import { SubAccounts } from "~/modules/sub-accounts";
import { ErrorCode } from "~/utils/errors";

const fake = {
  validHandle: "validhandle123"
};

describe("limits.set", () => {
  it("should successfully set the limit of a sub-account with a valid handle", async () => {
    const mockClient = {
      put: vi.fn().mockResolvedValueOnce(void 0)
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const { success, error } = await subAccounts.limits.set(fake.validHandle, { sends: 1 });

    expect(success).toBe(true);
    expect(error).toBeNull();
    expect(mockClient.put).toHaveBeenCalledWith(`/tx/v1/sub-account/${encodeURIComponent(fake.validHandle)}/limit`,
      expect.objectContaining({
        body: {
          sends: 1
        }
      })
    );
  });

  it("should contain error when handle is not provided", async () => {
    const mockClient = {
      put: vi.fn()
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const { success, error } = await subAccounts.limits.set("", { sends: 1 });

    expect(error).toBeTruthy();
    expect(success).toBe(false);
    expect(mockClient.put).not.toHaveBeenCalled();
  });

  it("should contain error when sends is negative", async () => {
    const mockClient = {
      put: vi.fn()
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const { success, error } = await subAccounts.limits.set(fake.validHandle, { sends: -1 });

    expect(error).toBeTruthy();
    expect(success).toBe(false);
    expect(mockClient.put).not.toHaveBeenCalled();
  });

  it("should contain error on api response error", async () => {
    const mockClient = {
      put: vi.fn().mockImplementationOnce(async (url, { onResponseError }) => {
        onResponseError({ response: { status: ErrorCode.BadRequest } });
      })
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const { success, error } = await subAccounts.limits.set(fake.validHandle, { sends: 1 });

    expect(error).toBeTruthy();
    expect(success).toBe(false);
    expect(mockClient.put).toHaveBeenCalled();
  });

  it("should handle catch block errors", async () => {
    const mockClient = {
      put: vi.fn().mockRejectedValueOnce(new Error("failure"))
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const { success, error } = await subAccounts.limits.set(fake.validHandle, { sends: 1 });

    expect(error).toBeTruthy();
    expect(success).toBe(false);
    expect(mockClient.put).toHaveBeenCalled();
  });

  it("should handle catch block with non-Error rejections", async () => {
    const mockClient = {
      put: vi.fn().mockRejectedValueOnce("error")
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const { success, error } = await subAccounts.limits.set(fake.validHandle, { sends: 1 });

    expect(error).toBeTruthy();
    expect(success).toBe(false);
    expect(mockClient.put).toHaveBeenCalled();
  });

  it("should do the same thing as setLimit", async () => {
    const mockClient = {
      put: vi.fn().mockResolvedValue(void 0)
    } as unknown as MailChannelsClient;

    const subAccounts = new SubAccounts(mockClient);
    const result = await subAccounts.limits.set(fake.validHandle, { sends: 1 });
    const deprecatedResult = await subAccounts.setLimit(fake.validHandle, { sends: 1 });

    expect(result).toStrictEqual(deprecatedResult);
    expect(mockClient.put).toHaveBeenCalledTimes(2);
  });
});
