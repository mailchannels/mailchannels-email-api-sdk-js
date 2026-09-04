import { describe, expect, it, vi } from "vitest";
import type { MailChannelsClient } from "~/client";
import { ErrorCode } from "~/internal/errors";
import { Suppressions } from "~/modules/suppressions";
import type { SuppressionsSource } from "~/types/suppressions/list";

const fake = {
  recipient: "test@example.com",
  source: "api" as const satisfies SuppressionsSource | "all"
};

describe("delete", () => {
  it("should successfully delete suppression entry", async () => {
    const mockClient = {
      delete: vi.fn().mockResolvedValueOnce(void 0)
    } as unknown as MailChannelsClient;

    const suppressions = new Suppressions(mockClient);
    const { success, error } = await suppressions.delete(fake.recipient, fake.source);

    expect(success).toBe(true);
    expect(error).toBeNull();
    expect(mockClient.delete).toHaveBeenCalledWith(`/tx/v1/suppression-list/recipients/${encodeURIComponent(fake.recipient)}`,
      expect.objectContaining({
        query: {
          source: fake.source
        }
      })
    );
  });

  it("should contain error when source is invalid", async () => {
    const mockClient = {
      delete: vi.fn()
    } as unknown as MailChannelsClient;

    const suppressions = new Suppressions(mockClient);
    // @ts-expect-error Testing invalid source value
    const { success, error } = await suppressions.delete(fake.recipient, "invalid-source");

    expect(success).toBe(false);
    expect(error).toBeTruthy();
    expect(mockClient.delete).not.toHaveBeenCalled();
  });

  it("should handle API error response on delete", async () => {
    const mockClient = {
      delete: vi.fn().mockImplementationOnce(async (url, { onResponseError }) => {
        onResponseError({ response: { status: ErrorCode.BadRequest } });
      })
    } as unknown as MailChannelsClient;

    const suppressions = new Suppressions(mockClient);
    const { success, error } = await suppressions.delete(fake.recipient, fake.source);

    expect(success).toBe(false);
    expect(error).toBeTruthy();
    expect(mockClient.delete).toHaveBeenCalled();
  });

  it("should handle catch block errors", async () => {
    const mockClient = {
      delete: vi.fn().mockRejectedValueOnce(new Error("failure"))
    } as unknown as MailChannelsClient;

    const suppressions = new Suppressions(mockClient);
    const { success, error } = await suppressions.delete(fake.recipient, fake.source);

    expect(error).toBeTruthy();
    expect(success).toBe(false);
    expect(mockClient.delete).toHaveBeenCalled();
  });

  it("should handle catch block with non-Error rejections", async () => {
    const mockClient = {
      delete: vi.fn().mockRejectedValueOnce("error")
    } as unknown as MailChannelsClient;

    const suppressions = new Suppressions(mockClient);
    const { success, error } = await suppressions.delete(fake.recipient, fake.source);

    expect(error).toBeTruthy();
    expect(success).toBe(false);
    expect(mockClient.delete).toHaveBeenCalled();
  });
});
