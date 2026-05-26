import { describe, expect, it, vi } from "vitest";
import type { MailChannelsClient } from "~/client";
import { Emails } from "~/modules/emails";
import type { EmailsSendOptions } from "~/types/emails/send";
import type { EmailsQueueResponse } from "~/types/emails/queue";
import { ErrorCode } from "~/utils/errors";
import type { EmailsQueueApiResponse } from "~/types/emails/internal";

const fake = {
  options: {
    to: "recipient@example.com",
    from: "sender@example.com",
    subject: "Test Subject",
    html: "<p>Test content</p>",
    text: "Test content",
    tracking: {
      click: {
        enable: true
      },
      open: {
        enable: true
      }
    }
  } satisfies EmailsSendOptions,
  apiResponse: {
    queued_at: "date-time-string",
    request_id: "test-async-request-id"
  } satisfies EmailsQueueApiResponse,
  expectedResponse: {
    data: {
      queuedAt: "date-time-string",
      requestId: "test-async-request-id"
    },
    error: null
  } satisfies EmailsQueueResponse
};

describe("queue", () => {
  it("should successfully queue an email", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValueOnce(fake.apiResponse)
    } as unknown as MailChannelsClient;

    const emails = new Emails(mockClient);
    const { data, error } = await emails.queue(fake.options);

    expect(error).toBeNull();
    expect(data).toStrictEqual(fake.expectedResponse.data);
    expect(mockClient.post).toHaveBeenCalled();
  });

  it("should contain error when payload is invalid in async mode", async () => {
    const mockClient = { post: vi.fn() } as unknown as MailChannelsClient;
    const emails = new Emails(mockClient);
    const options = { ...fake.options };
    // @ts-expect-error Testing missing from in async mode
    delete options.from;
    const { data, error } = await emails.queue(options);

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.post).not.toHaveBeenCalled();
  });

  it("should contain error on api response error", async () => {
    const mockClient = {
      post: vi.fn().mockImplementationOnce(async (url, { onResponseError }) => new Promise((_, reject) => {
        onResponseError({ response: { status: ErrorCode.Forbidden } });
        reject();
      }))
    } as unknown as MailChannelsClient;

    const emails = new Emails(mockClient);
    const { error } = await emails.queue(fake.options);

    expect(error).toBeTruthy();
    expect(mockClient.post).toHaveBeenCalled();
  });

  it("should handle catch block errors", async () => {
    const mockClient = {
      post: vi.fn().mockRejectedValueOnce(new Error("failure"))
    } as unknown as MailChannelsClient;

    const emails = new Emails(mockClient);
    const { error } = await emails.queue(fake.options);

    expect(error).toBeTruthy();
    expect(mockClient.post).toHaveBeenCalled();
  });

  it("should handle catch block with non-Error rejections", async () => {
    const mockClient = {
      post: vi.fn().mockRejectedValueOnce("error")
    } as unknown as MailChannelsClient;

    const emails = new Emails(mockClient);
    const { error } = await emails.queue(fake.options);

    expect(error).toBeTruthy();
    expect(mockClient.post).toHaveBeenCalled();
  });

  it("should do the same thing as sendAsync", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValue(fake.apiResponse)
    } as unknown as MailChannelsClient;

    const emails = new Emails(mockClient);
    const queueResponse = await emails.queue(fake.options);
    const asyncResponse = await emails.sendAsync(fake.options);

    expect(queueResponse).toStrictEqual(asyncResponse);
    expect(mockClient.post).toHaveBeenCalledTimes(2);
  });
});
