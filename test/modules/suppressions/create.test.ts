import { describe, expect, it, vi } from "vitest";
import type { MailChannelsClient } from "~/client";
import { ErrorCode } from "~/internal/errors";
import { Suppressions } from "~/modules/suppressions";
import type { SuppressionsCreateEntry, SuppressionsCreateOptions } from "~/types/suppressions/create";

const fake = {
  entries: [
    {
      recipient: "test@example.com",
      types: ["transactional"],
      notes: "Test suppression"
    }
  ] satisfies SuppressionsCreateEntry[],
  options: {
    addToSubAccounts: false
  } satisfies Omit<SuppressionsCreateOptions, "entries">
};

describe("create", () => {
  it("should successfully create suppression entries", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValueOnce(void 0)
    } as unknown as MailChannelsClient;

    const suppressions = new Suppressions(mockClient);
    const { success, error } = await suppressions.create(fake.entries, fake.options);

    expect(success).toBe(true);
    expect(error).toBeNull();
    expect(mockClient.post).toHaveBeenCalledWith("/tx/v1/suppression-list",
      expect.objectContaining({
        body: {
          add_to_sub_accounts: fake.options.addToSubAccounts,
          suppression_entries: fake.entries.map(entry => ({
            recipient: entry.recipient,
            suppression_types: entry.types,
            notes: entry.notes
          }))
        }
      })
    );
  });

  it("should default suppression type to non-transactional when types is not provided", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValueOnce(void 0)
    } as unknown as MailChannelsClient;

    const newEntries = structuredClone(fake.entries);
    // @ts-expect-error testing without types
    delete newEntries[0].types;

    const suppressions = new Suppressions(mockClient);
    const { success, error } = await suppressions.create(newEntries, fake.options);

    expect(success).toBe(true);
    expect(error).toBeNull();
    expect(mockClient.post).toHaveBeenCalled();
  });

  it("should contain error when entries exceed 1000", async () => {
    const mockClient = {
      post: vi.fn()
    } as unknown as MailChannelsClient;

    const suppressions = new Suppressions(mockClient);
    const { success, error } = await suppressions.create(Array.from({ length: 1001 }, (_, i) => ({ recipient: `test${i}@example.com` })));

    expect(error).toBeTruthy();
    expect(success).toBe(false);
    expect(mockClient.post).not.toHaveBeenCalled();
  });

  it("should contain error on api response error", async () => {
    const mockClient = {
      post: vi.fn().mockImplementationOnce(async (url, { onResponseError }) => {
        onResponseError({ response: { status: ErrorCode.BadRequest } });
      })
    } as unknown as MailChannelsClient;

    const suppressions = new Suppressions(mockClient);
    const { success, error } = await suppressions.create(fake.entries, fake.options);

    expect(success).toBe(false);
    expect(error).toBeTruthy();
    expect(mockClient.post).toHaveBeenCalled();
  });

  it("should handle catch block errors", async () => {
    const mockClient = {
      post: vi.fn().mockRejectedValueOnce(new Error("failure"))
    } as unknown as MailChannelsClient;

    const suppressions = new Suppressions(mockClient);
    const { success, error } = await suppressions.create(fake.entries, fake.options);

    expect(error).toBeTruthy();
    expect(success).toBe(false);
    expect(mockClient.post).toHaveBeenCalled();
  });

  it("should handle catch block with non-Error rejections", async () => {
    const mockClient = {
      post: vi.fn().mockRejectedValueOnce("error")
    } as unknown as MailChannelsClient;

    const suppressions = new Suppressions(mockClient);
    const { success, error } = await suppressions.create(fake.entries, fake.options);

    expect(error).toBeTruthy();
    expect(success).toBe(false);
    expect(mockClient.post).toHaveBeenCalled();
  });

  it("should handle deprecated create method with options object", async () => {
    const mockClient = {
      post: vi.fn().mockResolvedValueOnce(void 0)
    } as unknown as MailChannelsClient;

    const suppressions = new Suppressions(mockClient);
    const { success, error } = await suppressions.create({
      entries: fake.entries,
      addToSubAccounts: fake.options.addToSubAccounts
    });

    expect(success).toBe(true);
    expect(error).toBeNull();
    expect(mockClient.post).toHaveBeenCalled();
  });
});
