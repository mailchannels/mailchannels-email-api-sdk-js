import { describe, expect, it, vi } from "vitest";
import type { MailChannelsClient } from "~/client";
import { ErrorCode } from "~/internal/errors";
import { Suppressions } from "~/modules/suppressions";
import type { SuppressionsListApiResponse } from "~/types/suppressions/internal";
import type { SuppressionsListOptions, SuppressionsListResponse } from "~/types/suppressions/list";
import { formatDateInput } from "~/internal/parse-date-inputs";

const fake = {
  options: {
    recipient: "test@example.com",
    source: "hard_bounce",
    createdAfter: "2026-06-01T00:00:00Z",
    createdBefore: "2026-07-01T00:00:00Z",
    limit: 10,
    offset: 0
  } satisfies SuppressionsListOptions,
  apiResponse: {
    suppression_list: [
      {
        created_at: "2026-06-15T15:51:28.071Z",
        notes: "string",
        recipient: "string",
        sender: "string",
        source: "api",
        suppression_types: [
          "transactional"
        ]
      }
    ]
  } satisfies SuppressionsListApiResponse,
  expectedResponse: {
    data: [
      {
        createdAt: "2026-06-15T15:51:28.071Z",
        notes: "string",
        recipient: "string",
        sender: "string",
        source: "api",
        types: [
          "transactional"
        ]
      }
    ],
    error: null
  } satisfies SuppressionsListResponse
};

describe("list", () => {
  it("should successfully list suppression entries", async () => {
    const mockClient = {
      get: vi.fn().mockResolvedValueOnce(fake.apiResponse)
    } as unknown as MailChannelsClient;

    const suppressions = new Suppressions(mockClient);
    const { data, error } = await suppressions.list(fake.options);

    expect(data).toStrictEqual(fake.expectedResponse.data);
    expect(error).toBeNull();
    expect(mockClient.get).toHaveBeenCalledWith("/tx/v1/suppression-list",
      expect.objectContaining({
        query: {
          recipient: fake.options.recipient,
          source: fake.options.source,
          created_after: formatDateInput(fake.options.createdAfter),
          created_before: formatDateInput(fake.options.createdBefore),
          limit: fake.options.limit,
          offset: fake.options.offset
        }
      })
    );
  });

  it("should contain error for invalid limit (0)", async () => {
    const mockClient = {
      get: vi.fn()
    } as unknown as MailChannelsClient;

    const suppressions = new Suppressions(mockClient);
    const { data, error } = await suppressions.list({ ...fake.options, limit: 0 });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should contain error for invalid limit (1001)", async () => {
    const mockClient = {
      get: vi.fn()
    } as unknown as MailChannelsClient;

    const suppressions = new Suppressions(mockClient);
    const { data, error } = await suppressions.list({ ...fake.options, limit: 1001 });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should contain error when recipient exceeds 255 characters", async () => {
    const mockClient = {
      get: vi.fn()
    } as unknown as MailChannelsClient;

    const suppressions = new Suppressions(mockClient);
    const { data, error } = await suppressions.list({ recipient: "a".repeat(256) });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should contain error when source is invalid", async () => {
    const mockClient = {
      get: vi.fn()
    } as unknown as MailChannelsClient;

    const suppressions = new Suppressions(mockClient);
    // @ts-expect-error Testing invalid source value
    const { data, error } = await suppressions.list({ ...fake.options, source: "all" });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should contain error for invalid offset", async () => {
    const mockClient = {
      get: vi.fn()
    } as unknown as MailChannelsClient;

    const suppressions = new Suppressions(mockClient);
    const { data, error } = await suppressions.list({ ...fake.options, offset: -1 });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should contain error for invalid createdBefore date", async () => {
    const mockClient = {
      get: vi.fn()
    } as unknown as MailChannelsClient;

    const suppressions = new Suppressions(mockClient);
    const { data, error } = await suppressions.list({ ...fake.options, createdBefore: "invalid-date" });

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).not.toHaveBeenCalled();
  });

  it("should contain error for invalid createdAfter date", async () => {
    const mockClient = {
      get: vi.fn()
    } as unknown as MailChannelsClient;

    const suppressions = new Suppressions(mockClient);
    const { data, error } = await suppressions.list({ ...fake.options, createdAfter: "invalid-date" });

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

    const suppressions = new Suppressions(mockClient);
    const { data, error } = await suppressions.list();

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });

  it("should handle catch block errors", async () => {
    const mockClient = {
      get: vi.fn().mockRejectedValueOnce(new Error("failure"))
    } as unknown as MailChannelsClient;

    const suppressions = new Suppressions(mockClient);
    const { data, error } = await suppressions.list();

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });

  it("should handle catch block with non-Error rejections", async () => {
    const mockClient = {
      get: vi.fn().mockRejectedValueOnce("error")
    } as unknown as MailChannelsClient;

    const suppressions = new Suppressions(mockClient);
    const { data, error } = await suppressions.list();

    expect(error).toBeTruthy();
    expect(data).toBeNull();
    expect(mockClient.get).toHaveBeenCalled();
  });
});
