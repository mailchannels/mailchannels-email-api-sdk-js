import { describe, expect, it, vi } from "vitest";
import type { MailChannelsClient } from "~/client";
import { Webhooks } from "~/modules/webhooks";
import { ErrorCode } from "~/utils/errors";
import type { WebhooksBatchesApiResponse } from "~/types/webhooks/internal";
import type { WebhooksBatchesOptions, WebhooksBatchesResponse } from "~/types/webhooks/batches";

const fake = {
  options: {
    webhook: "https://example.com/webhook",
    createdAfter: "2026-06-01T00:00:00Z",
    createdBefore: "2026-07-01T00:00:00Z",
    statuses: ["1xx", "2xx", "3xx", "4xx", "5xx", "no_response"],
    limit: 500,
    offset: 0
  } satisfies WebhooksBatchesOptions,
  apiResponse: {
    webhook_batches: [
      {
        batch_id: 1,
        created_at: "2026-06-15T15:51:28.071Z",
        customer_handle: "test-customer",
        duration: { unit: "milliseconds", value: 120 },
        event_count: 5,
        status: "2xx_response",
        status_code: 200,
        webhook: "https://example.com/webhook"
      }
    ]
  } satisfies WebhooksBatchesApiResponse,
  expectedResponse: {
    data: [
      {
        batchId: 1,
        createdAt: "2026-06-15T15:51:28.071Z",
        customerHandle: "test-customer",
        duration: { unit: "milliseconds", value: 120 },
        eventCount: 5,
        status: "2xx_response",
        statusCode: 200,
        webhook: "https://example.com/webhook"
      }
    ],
    error: null
  } satisfies WebhooksBatchesResponse
};

describe("batches", () => {
  it("should successfully retrieve webhook batches", async () => {
    const mockClient = {
      get: vi.fn().mockResolvedValueOnce(fake.apiResponse)
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { data, error } = await webhooks.batches(fake.options);

    expect(data).toStrictEqual(fake.expectedResponse.data);
    expect(error).toBeNull();
    expect(mockClient.get).toHaveBeenCalledWith("/tx/v1/webhook-batch",
      expect.objectContaining({
        query: {
          webhook: fake.options.webhook,
          created_after: fake.options.createdAfter,
          created_before: fake.options.createdBefore,
          statuses: fake.options.statuses,
          limit: fake.options.limit,
          offset: fake.options.offset
        }
      })
    );
  });

  it("should successfully retrieve webhook batches with valid date range", async () => {
    const mockClient = {
      get: vi.fn().mockResolvedValueOnce(fake.apiResponse)
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { data, error } = await webhooks.batches({ createdAfter: "2024-07-01", createdBefore: "2024-07-08" });

    expect(data).toStrictEqual(fake.expectedResponse.data);
    expect(error).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });

  it("should contain error for invalid limit (0)", async () => {
    const mockClient = {
      get: vi.fn()
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { data, error } = await webhooks.batches({ ...fake.options, limit: 0 });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should contain error for invalid limit (501)", async () => {
    const mockClient = {
      get: vi.fn()
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { data, error } = await webhooks.batches({ ...fake.options, limit: 501 });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should contain error for invalid offset", async () => {
    const mockClient = {
      get: vi.fn()
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { data, error } = await webhooks.batches({ ...fake.options, offset: -1 });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should contain error for too many statuses (more than 6)", async () => {
    const mockClient = {
      get: vi.fn()
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { data, error } = await webhooks.batches({ statuses: ["1xx", "2xx", "3xx", "4xx", "5xx", "no_response", "1xx"] });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should contain error for duplicate statuses", async () => {
    const mockClient = {
      get: vi.fn()
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { data, error } = await webhooks.batches({ statuses: ["2xx", "2xx"] });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should contain error for invalid createdAfter", async () => {
    const mockClient = {
      get: vi.fn()
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { data, error } = await webhooks.batches({ createdAfter: "not-a-date" });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should contain error for invalid createdBefore", async () => {
    const mockClient = {
      get: vi.fn()
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { data, error } = await webhooks.batches({ createdBefore: "not-a-date" });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should contain error when createdBefore is not later than createdAfter", async () => {
    const mockClient = {
      get: vi.fn()
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { data, error } = await webhooks.batches({ createdAfter: "2024-07-29", createdBefore: "2024-07-28" });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should contain error when time range exceeds 31 days", async () => {
    const mockClient = {
      get: vi.fn()
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { data, error } = await webhooks.batches({ createdAfter: "2024-07-01", createdBefore: "2024-08-02" });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should contain error on api response error", async () => {
    const mockClient = {
      get: vi.fn().mockImplementationOnce(async (url, { onResponseError }) => new Promise((_, reject) => {
        onResponseError({ response: { status: ErrorCode.BadRequest } });
        reject();
      }))
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { data, error } = await webhooks.batches();

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });

  it("should handle catch block errors", async () => {
    const mockClient = {
      get: vi.fn().mockRejectedValueOnce(new Error("failure"))
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { data, error } = await webhooks.batches();

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });

  it("should handle catch block with non-Error rejections", async () => {
    const mockClient = {
      get: vi.fn().mockRejectedValueOnce("error")
    } as unknown as MailChannelsClient;

    const webhooks = new Webhooks(mockClient);
    const { data, error } = await webhooks.batches();

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });
});
