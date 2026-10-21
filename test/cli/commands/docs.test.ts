import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import docs from "~/cli/commands/docs";
import { styleText } from "~/cli/utils/shared/style";

const { mockPlatform, mockSpawn, mockChild } = vi.hoisted(() => {
  const mockChild = {
    on: vi.fn(),
    unref: vi.fn()
  };

  return {
    mockPlatform: vi.fn(),
    mockSpawn: vi.fn().mockReturnValue(mockChild),
    mockChild
  };
});

vi.mock("node:child_process", () => ({
  spawn: mockSpawn
}));

vi.mock("node:os", () => ({
  platform: mockPlatform
}));

const originalExitCode = process.exitCode;

describe("docs", () => {
  beforeEach(() => {
    mockPlatform.mockReset();
    mockSpawn.mockReset().mockReturnValue(mockChild);
    mockChild.on.mockReset();
    mockChild.unref.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    process.exitCode = originalExitCode;
    vi.restoreAllMocks();
  });

  it.each([
    {
      os: "win32",
      command: "cmd",
      args: ["/c", "start", "", "https://docs.mailchannels.com"]
    },
    {
      os: "darwin",
      command: "open",
      args: ["https://docs.mailchannels.com"]
    },
    {
      os: "linux",
      command: "xdg-open",
      args: ["https://docs.mailchannels.com"]
    }
  ])("should open the documentation on $os", async ({ os, command, args }) => {
    mockPlatform.mockReturnValue(os);

    await runCommand(docs, { rawArgs: [] });

    expect(mockSpawn).toHaveBeenCalledWith(command, args, {
      detached: true,
      stdio: "ignore"
    });
    expect(mockChild.on).toHaveBeenCalledWith("error", expect.any(Function));
    expect(mockChild.unref).toHaveBeenCalledOnce();

    const spawnHandler = mockChild.on.mock.calls.find(([event]) => event === "spawn")?.[1];
    expect(spawnHandler).toBeTypeOf("function");
    spawnHandler?.();

    expect(console.info).toHaveBeenCalledWith(
      `Opened ${styleText(["cyan", "underline"], "https://docs.mailchannels.com")} in your browser.`
    );
  });

  it("should report unsupported operating systems", async () => {
    mockPlatform.mockReturnValue("freebsd");

    await runCommand(docs, { rawArgs: [] });

    expect(mockSpawn).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      "Opening the documentation is not supported on freebsd."
    );
    expect(process.exitCode).toBe(1);
  });

  it("should report browser launch errors", async () => {
    mockPlatform.mockReturnValue("linux");

    await runCommand(docs, { rawArgs: [] });

    const errorHandler = mockChild.on.mock.calls.find(([event]) => event === "error")?.[1];
    expect(errorHandler).toBeTypeOf("function");
    errorHandler?.(new Error("launcher not found"));

    expect(console.error).toHaveBeenCalledWith("Could not open the browser: launcher not found");
    expect(process.exitCode).toBe(1);
  });
});
