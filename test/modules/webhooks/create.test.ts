import { describe, expect, it, vi } from "vitest";
import type { MailChannelsClient } from "~/client";
import { Webhooks } from "~/modules/webhooks";
import { ErrorCode } from "~/internal/errors";
import type { WebhooksCreateOptions } from "~/types/webhooks/create";

const fake = {
  endpoint: "https://example.com/webhook",
  options: {
    failureThreshold: 1
  } satisfies WebhooksCreateOptions
};

describe("create", () => {
  it("should successfully create a webhook endpoint without options", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValueOnce(void 0)
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { success, error } = await webhooks.create(fake.endpoint);

    expect(success).toBe(true);
    expect(error).toBeNull();
    expect(mockClient.post).toHaveBeenCalledWith("/tx/v1/webhook",
      expect.objectContaining({
        query: {
          endpoint: fake.endpoint
        },
        body: {}
      })
    );
  });

  it.each(
    [1, 0, null]
  )("should accept a webhook with failure threshold %s", async (failureThreshold) => {
    const mockClient = {
      post: vi.fn().mockResolvedValueOnce(void 0)
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { success, error } = await webhooks.create(fake.endpoint, {
      failureThreshold
    });

    expect(success).toBe(true);
    expect(error).toBeNull();
    expect(mockClient.post).toHaveBeenCalledWith("/tx/v1/webhook",
      expect.objectContaining({
        query: {
          endpoint: fake.endpoint
        },
        body: {
          failure_threshold: failureThreshold
        }
      })
    );
  });

  it("should contain error if the endpoint is not provided", async () => {
    const mockClient = { post: vi.fn() } as unknown as MailChannelsClient;
    const webhooks = new Webhooks(mockClient);
    // @ts-expect-error Testing missing endpoint error
    const { success, error } = await webhooks.create();

    expect(error).toBeTruthy();
    expect(success).toBe(false);
    expect(mockClient.post).not.toHaveBeenCalled();
  });

  it("should contain error if the endpoint exceeds maximum length", async () => {
    const mockClient = { post: vi.fn() } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const longEndpoint = "https://example.com/" + "a".repeat(7990);

    const { success, error } = await webhooks.create(longEndpoint);

    expect(error).toBeTruthy();
    expect(success).toBe(false);
    expect(mockClient.post).not.toHaveBeenCalled();
  });

  it.each(
    [-1, 1.5, NaN, Infinity, -Infinity]
  )("should reject an invalid failure threshold of %s", async (failureThreshold) => {
    const mockClient = {
      post: vi.fn().mockResolvedValueOnce(void 0)
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { success, error } = await webhooks.create(fake.endpoint, {
      failureThreshold
    });

    expect(error).toMatchObject({
      message: "Failure threshold must be a non-negative integer.",
      type: "validation_error"
    });
    expect(success).toBe(false);
    expect(mockClient.post).not.toHaveBeenCalled();
  });

  it("should contain error on api response error", async () => {
    const mockClient = {
      post: vi.fn().mockImplementationOnce(async (url, { onResponseError }) => {
        onResponseError({ response: { status: ErrorCode.Conflict } });
      })
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { success, error } = await webhooks.create(fake.endpoint);

    expect(error).toBeTruthy();
    expect(success).toBe(false);
    expect(mockClient.post).toHaveBeenCalled();
  });

  it("should handle catch block errors", async () => {
    const mockClient = {
      post: vi.fn().mockRejectedValueOnce(new Error("failure"))
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { success, error } = await webhooks.create(fake.endpoint);

    expect(error).toBeTruthy();
    expect(success).toBe(false);
    expect(mockClient.post).toHaveBeenCalled();
  });

  it("should handle catch block with non-Error rejections", async () => {
    const mockClient = {
      post: vi.fn().mockRejectedValueOnce("error")
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { success, error } = await webhooks.create(fake.endpoint);

    expect(error).toBeTruthy();
    expect(success).toBe(false);
    expect(mockClient.post).toHaveBeenCalled();
  });
});
