import { describe, expect, it, vi } from "vitest";

describe("unknown", () => {
  it("should error when an unknown command is provided", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    process.argv = ["node", "cli/index.ts", "unknown"];
    await expect(import("~/cli")).rejects.toThrow(expect.anything());
    expect(errorSpy).toHaveBeenCalledWith("[MailChannels-CLI]", "Unknown command: unknown");
    errorSpy.mockRestore();
  });
});
