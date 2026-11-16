import { describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import dashboard from "~/cli/commands/dashboard";

const mockOpenUrl = vi.hoisted(() => vi.fn());

vi.mock("~/cli/utils/shared/open-url", () => ({
  openUrl: mockOpenUrl
}));

describe("dashboard", () => {
  it("should open the dashboard URL", async () => {
    await runCommand(dashboard, { rawArgs: [] });

    expect(mockOpenUrl).toHaveBeenCalledOnce();
    expect(mockOpenUrl).toHaveBeenCalledWith("https://dash.mailchannels.com");
  });
});