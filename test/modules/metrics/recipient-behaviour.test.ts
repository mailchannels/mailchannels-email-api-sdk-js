import { describe, expect, it, vi } from "vitest";
import type { MailChannelsClient } from "~/client";
import { Metrics } from "~/modules/metrics";
import { ErrorCode } from "~/internal/errors";
import type { MetricsRecipientBehaviourResponse } from "~/types/metrics/recipient-behaviour";
import type { MetricsRecipientBehaviourApiResponse } from "~/types/metrics/internal";
import type { MetricsOptions } from "~/types/metrics";
import { formatDateInput } from "~/internal/parse-date-inputs";

const fake = {
  options: {
    startTime: "2024-07-01T00:00:00Z",
    endTime: "2024-07-31T23:59:59Z",
    campaignId: "campaign123",
    interval: "day"
  } satisfies MetricsOptions,
  apiResponse: {
    buckets: {
      unsubscribe_delivered: [{ count: 0, period_start: "2024-07-29T15:51:28.071Z" }],
      unsubscribed: [{ count: 0, period_start: "2024-07-29T15:51:28.071Z" }]
    },
    end_time: "2024-07-29T15:51:28.071Z",
    start_time: "2024-07-29T15:51:28.071Z",
    unsubscribe_delivered: 0,
    unsubscribed: 0
  } satisfies MetricsRecipientBehaviourApiResponse,
  expectedResponse: {
    data: {
      buckets: {
        unsubscribeDelivered: [{ count: 0, periodStart: "2024-07-29T15:51:28.071Z" }],
        unsubscribed: [{ count: 0, periodStart: "2024-07-29T15:51:28.071Z" }]
      },
      endTime: "2024-07-29T15:51:28.071Z",
      startTime: "2024-07-29T15:51:28.071Z",
      unsubscribeDelivered: 0,
      unsubscribed: 0
    },
    error: null
  } satisfies MetricsRecipientBehaviourResponse
};

describe("recipientBehaviour", () => {
  it("should successfully retrieve recipient behaviour metrics", async () => {
    const mockClient = {
      get: vi.fn().mockResolvedValueOnce(fake.apiResponse)
    } as unknown as MailChannelsClient;

    const metrics = new Metrics(mockClient);
    const { data, error } = await metrics.recipientBehaviour(fake.options);

    expect(data).toStrictEqual(fake.expectedResponse.data);
    expect(error).toBeNull();
    expect(mockClient.get).toHaveBeenCalledWith("/tx/v1/metrics/recipient-behaviour",
      expect.objectContaining({
        query: {
          start_time: formatDateInput(fake.options.startTime),
          end_time: formatDateInput(fake.options.endTime),
          campaign_id: fake.options.campaignId,
          interval: fake.options.interval
        }
      })
    );
  });

  it("should contain error for invalid startTime date", async () => {
    const mockClient = {
      get: vi.fn()
    } as unknown as MailChannelsClient;

    const metrics = new Metrics(mockClient);
    const { data, error } = await metrics.recipientBehaviour({ ...fake.options, startTime: "invalid-date" });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should contain error for invalid endTime date", async () => {
    const mockClient = {
      get: vi.fn()
    } as unknown as MailChannelsClient;

    const metrics = new Metrics(mockClient);
    const { data, error } = await metrics.recipientBehaviour({ ...fake.options, endTime: "invalid-date" });

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

    const metrics = new Metrics(mockClient);
    const { data, error } = await metrics.recipientBehaviour();

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });

  it("should handle catch block errors if onResponseError is not triggered", async () => {
    const mockClient = {
      get: vi.fn().mockRejectedValueOnce(new Error("failure"))
    } as unknown as MailChannelsClient;

    const metrics = new Metrics(mockClient);
    const { data, error } = await metrics.recipientBehaviour();

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });

  it("should handle catch block with non-Error rejections", async () => {
    const mockClient = {
      get: vi.fn().mockRejectedValueOnce("error")
    } as unknown as MailChannelsClient;

    const metrics = new Metrics(mockClient);
    const { data, error } = await metrics.recipientBehaviour();

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });
});
