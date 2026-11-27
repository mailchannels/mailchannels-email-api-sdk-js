import { describe, expect, it, vi } from "vitest";
import type { MailChannelsClient } from "~/client";
import { ErrorCode } from "~/internal/errors";
import { Webhooks } from "~/modules/webhooks";

const fake = {
  endpoint: "https://example.com/webhook?source=mailchannels"
};

describe("deleteFailureThreshold", () => {
  it("should remove the failure threshold for the specified endpoint", async () => {
    const mockClient = {
      delete: vi.fn().mockResolvedValueOnce(void 0)
    } as unknown as MailChannelsClient;
    const webhooks = new Webhooks(mockClient);

    const result = await webhooks.deleteFailureThreshold(fake.endpoint);

    expect(result).toEqual({ success: true, error: null });
    expect(mockClient.delete).toHaveBeenCalledExactlyOnceWith("/tx/v1/webhook/failure-threshold", {
      query: { endpoint: fake.endpoint },
      onResponseError: expect.any(Function)
    });
  });

  it("should reject a missing endpoint", async () => {
    const mockClient = { delete: vi.fn() } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { success, error } = await webhooks.deleteFailureThreshold("");

    expect(success).toBe(false);
    expect(error).toMatchObject({
      message: "No endpoint provided.",
      type: "validation_error"
    });
    expect(mockClient.delete).not.toHaveBeenCalled();
  });

  it("should reject an endpoint that exceeds maximum length", async () => {
    const mockClient = { delete: vi.fn() } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const longEndpoint = "https://example.com/" + "a".repeat(7990);

    const { success, error } = await webhooks.deleteFailureThreshold(longEndpoint);

    expect(success).toBe(false);
    expect(error).toMatchObject({
      message: "The endpoint exceeds the maximum length of 8000 characters.",
      type: "validation_error"
    });
    expect(mockClient.delete).not.toHaveBeenCalled();
  });

  it("should contain error on api response error", async () => {
    const mockClient = {
      delete: vi.fn().mockImplementationOnce(async (url, { onResponseError }) => {
        onResponseError({ response: { status: ErrorCode.NotFound } });
      })
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { success, error } = await webhooks.deleteFailureThreshold(fake.endpoint);

    expect(error).toMatchObject({
      message: `Endpoint '${fake.endpoint}' is not enrolled.`,
      statusCode: ErrorCode.NotFound,
      type: "not_found"
    });
    expect(success).toBe(false);
    expect(mockClient.delete).toHaveBeenCalled();
  });

  it("should handle catch block errors", async () => {
    const mockClient = {
      delete: vi.fn().mockRejectedValueOnce(new Error("failure"))
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { success, error } = await webhooks.deleteFailureThreshold(fake.endpoint);

    expect(error).toBeTruthy();
    expect(success).toBe(false);
    expect(mockClient.delete).toHaveBeenCalled();
  });

  it("should handle catch block with non-Error rejections", async () => {
    const mockClient = {
      delete: vi.fn().mockRejectedValueOnce("error")
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { success, error } = await webhooks.deleteFailureThreshold(fake.endpoint);

    expect(error).toBeTruthy();
    expect(success).toBe(false);
    expect(mockClient.delete).toHaveBeenCalled();
  });
});
