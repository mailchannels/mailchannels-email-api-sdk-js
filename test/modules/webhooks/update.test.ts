import { describe, expect, it, vi } from "vitest";
import type { MailChannelsClient } from "~/client";
import { Webhooks } from "~/modules/webhooks";
import { ErrorCode } from "~/internal/errors";

const fake = {
  endpoint: "https://example.com/webhook",
  failureThreshold: 2
};

describe("update", () => {
  it("should successfully update the failure threshold", async () => {
    const mockClient = {
      patch: vi.fn().mockResolvedValueOnce(void 0)
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { success, error } = await webhooks.update(fake.endpoint, fake.failureThreshold);

    expect(success).toBe(true);
    expect(error).toBeNull();
    expect(mockClient.patch).toHaveBeenCalledWith("/tx/v1/webhook", expect.objectContaining({
      query: {
        endpoint: fake.endpoint
      },
      body: {
        failure_threshold: fake.failureThreshold
      }
    }));
  });

  it("should reject a missing endpoint", async () => {
    const mockClient = { patch: vi.fn() } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { success, error } = await webhooks.update("", fake.failureThreshold);

    expect(success).toBe(false);
    expect(error).toMatchObject({
      message: "No endpoint provided.",
      type: "validation_error"
    });
    expect(mockClient.patch).not.toHaveBeenCalled();
  });

  it("should reject an endpoint that exceeds maximum length", async () => {
    const mockClient = { patch: vi.fn() } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const longEndpoint = "https://example.com/" + "a".repeat(7990);

    const { success, error } = await webhooks.update(longEndpoint, fake.failureThreshold);

    expect(success).toBe(false);
    expect(error).toMatchObject({
      message: "The endpoint exceeds the maximum length of 8000 characters.",
      type: "validation_error"
    });
    expect(mockClient.patch).not.toHaveBeenCalled();
  });

  it.each(
    [0, -1, 1.5, NaN, Infinity, -Infinity, undefined, null]
  )("should reject an invalid failure threshold of %s", async (failureThreshold) => {
    const mockClient = { patch: vi.fn() } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    // @ts-expect-error Testing JavaScript callers that omit the threshold or pass null.
    const { success, error } = await webhooks.update(fake.endpoint, failureThreshold);

    expect(success).toBe(false);
    expect(error).toMatchObject({
      message: "Failure threshold must be 1 or greater.",
      type: "validation_error"
    });
    expect(mockClient.patch).not.toHaveBeenCalled();
  });

  it("should contain error on api response error", async () => {
    const mockClient = {
      patch: vi.fn().mockImplementationOnce(async (url, { onResponseError }) => {
        onResponseError({ response: { status: ErrorCode.NotFound } });
      })
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { success, error } = await webhooks.update(fake.endpoint, fake.failureThreshold);

    expect(error).toMatchObject({
      message: `Endpoint '${fake.endpoint}' is not enrolled.`,
      statusCode: ErrorCode.NotFound,
      type: "not_found"
    });
    expect(success).toBe(false);
    expect(mockClient.patch).toHaveBeenCalled();
  });

  it("should handle catch block errors", async () => {
    const mockClient = {
      patch: vi.fn().mockRejectedValueOnce(new Error("failure"))
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { success, error } = await webhooks.update(fake.endpoint, fake.failureThreshold);

    expect(error).toBeTruthy();
    expect(success).toBe(false);
    expect(mockClient.patch).toHaveBeenCalled();
  });

  it("should handle catch block with non-Error rejections", async () => {
    const mockClient = {
      patch: vi.fn().mockRejectedValueOnce("error")
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { success, error } = await webhooks.update(fake.endpoint, fake.failureThreshold);

    expect(error).toBeTruthy();
    expect(success).toBe(false);
    expect(mockClient.patch).toHaveBeenCalled();
  });
});
