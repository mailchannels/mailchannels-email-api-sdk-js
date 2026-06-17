import { describe, expect, it, vi } from "vitest";
import type { MailChannelsClient } from "~/client";
import { Domains } from "~/modules/domains";
import { ErrorCode } from "~/utils/errors";

describe("dkim.updateStatus", () => {
  it("should successfully update a DKIM key", async () => {
    const mockClient = {
      patch: vi.fn().mockResolvedValueOnce(void 0)
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { success, error } = await domains.dkim.updateStatus("example.com", {
      selector: "mailchannels-test",
      status: "retired"
    });

    expect(success).toBe(true);
    expect(error).toBeNull();
    expect(mockClient.patch).toHaveBeenCalledWith("/tx/v1/domains/example.com/dkim-keys/mailchannels-test",
      expect.objectContaining({
        body: {
          status: "retired"
        }
      })
    );
  });

  it("should return error if domain is not provided", async () => {
    const mockClient = { patch: vi.fn() } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { success, error } = await domains.dkim.updateStatus("", {
      selector: "mailchannels-test",
      status: "retired"
    });

    expect(error).toBeTruthy();
    expect(success).toBe(false);
    expect(mockClient.patch).not.toHaveBeenCalled();
  });

  it("should contain error on api response error", async () => {
    const mockClient = {
      patch: vi.fn().mockImplementationOnce(async (url, { onResponseError }) => {
        onResponseError({ response: { status: ErrorCode.NotFound } });
      })
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { success, error } = await domains.dkim.updateStatus("example.com", {
      selector: "mailchannels-test",
      status: "retired"
    });

    expect(success).toBe(false);
    expect(error).toBeTruthy();
    expect(mockClient.patch).toHaveBeenCalled();
  });

  it("should return error if selector is missing or more than 63 characters", async () => {
    const mockClient = { patch: vi.fn() } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { success, error } = await domains.dkim.updateStatus("example.com", {
      selector: "a".repeat(64),
      status: "retired"
    });

    expect(success).toBe(false);
    expect(error).toBeTruthy();
    expect(mockClient.patch).not.toHaveBeenCalled();
  });

  it("should handle catch block errors", async () => {
    const mockClient = {
      patch: vi.fn().mockRejectedValueOnce(new Error("failure"))
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { success, error } = await domains.dkim.updateStatus("example.com", {
      selector: "mailchannels",
      status: "retired"
    });

    expect(error).toBeTruthy();
    expect(success).toBe(false);
    expect(mockClient.patch).toHaveBeenCalled();
  });

  it("should handle catch block with non-Error rejections", async () => {
    const mockClient = {
      patch: vi.fn().mockRejectedValueOnce("error")
    } as unknown as MailChannelsClient;

    const domains = new Domains(mockClient);
    const { success, error } = await domains.dkim.updateStatus("example.com", {
      selector: "mailchannels",
      status: "retired"
    });

    expect(error).toBeTruthy();
    expect(success).toBe(false);
    expect(mockClient.patch).toHaveBeenCalled();
  });
});
