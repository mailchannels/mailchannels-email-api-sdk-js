import { describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import docs from "~/cli/commands/docs";

const mockOpenUrl = vi.hoisted(() => vi.fn());

vi.mock("~/cli/utils/shared/open-url", () => ({
  openUrl: mockOpenUrl
}));

describe("docs", () => {
  it("should open the documentation URL", async () => {
    await runCommand(docs, { rawArgs: [] });

    expect(mockOpenUrl).toHaveBeenCalledOnce();
    expect(mockOpenUrl).toHaveBeenCalledWith("https://docs.mailchannels.com");
  });
});