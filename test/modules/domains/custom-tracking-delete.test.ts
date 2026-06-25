import { describe, expect, it, vi } from "vitest";
import type { MailChannelsClient } from "~/client";
import { Domains } from "~/modules/domains";
import { ErrorCode } from "~/utils/errors";

describe("customTracking.delete", () => {
  it("should delete and return success true", async () => {
    const mockClient = {
      delete: vi.fn().mockResolvedValueOnce(undefined)
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { success, error } = await domains.customTracking.delete("open.example.com", "open");

    expect(success).toBe(true);
    expect(error).toBeNull();
    expect(mockClient.delete).toHaveBeenCalledWith("/tx/v1/custom-tracking-domains/open.example.com/open", expect.any(Object));
  });

  it("should contain error for missing hostname", async () => {
    const mockClient = { delete: vi.fn() } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { success, error } = await domains.customTracking.delete("", "click");

    expect(success).toBe(false);
    expect(error).toBeTruthy();
    expect(mockClient.delete).not.toHaveBeenCalled();
  });

  it("should contain error if scope is invalid", async () => {
    const mockClient = { delete: vi.fn() } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    // @ts-expect-error Testing invalid scope
    const { success, error } = await domains.customTracking.delete("open.example.com", "invalid-scope");

    expect(success).toBe(false);
    expect(error).toBeTruthy();
    expect(mockClient.delete).not.toHaveBeenCalled();
  });

  it("should contain error on api response error", async () => {
    const mockClient = {
      delete: vi.fn().mockImplementationOnce(async (url, { onResponseError }) => new Promise((_, reject) => {
        onResponseError({ response: { status: ErrorCode.NotFound } });
        reject();
      }))
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { success, error } = await domains.customTracking.delete("open.example.com", "open");

    expect(success).toBe(false);
    expect(error).toBeTruthy();
  });
});
