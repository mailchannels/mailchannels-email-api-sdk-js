import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { openUrl } from "~/cli/utils/shared/open-url";
import { styleText } from "~/cli/utils/shared/style";

const exampleUrl = "https://example.com";

const { mockSpawn, mockChild } = vi.hoisted(() => {
  const mockChild = {
    on: vi.fn(),
    unref: vi.fn()
  };

  return {
    mockSpawn: vi.fn().mockReturnValue(mockChild),
    mockChild
  };
});

vi.mock("node:child_process", () => ({
  spawn: mockSpawn
}));

const originalPlatform = Object.getOwnPropertyDescriptor(process, "platform");
const originalExitCode = process.exitCode;

const setPlatform = (platform: string) => {
  Object.defineProperty(process, "platform", { value: platform });
};

describe("openUrl", () => {
  beforeEach(() => {
    mockSpawn.mockReset().mockReturnValue(mockChild);
    mockChild.on.mockReset();
    mockChild.unref.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalPlatform) {
      Object.defineProperty(process, "platform", originalPlatform);
    }
    process.exitCode = originalExitCode;
    vi.restoreAllMocks();
  });

  it.each([
    {
      os: "win32",
      command: "cmd",
      args: ["/c", "start", "", exampleUrl]
    },
    {
      os: "darwin",
      command: "open",
      args: [exampleUrl]
    },
    {
      os: "linux",
      command: "xdg-open",
      args: [exampleUrl]
    }
  ])("should open a URL on $os", ({ os, command, args }) => {
    setPlatform(os);

    openUrl(exampleUrl);

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
      `Opened ${styleText(["cyan", "underline"], exampleUrl)} in your browser.`
    );
  });

  it("should report unsupported operating systems", () => {
    setPlatform("freebsd");

    openUrl(exampleUrl);

    expect(mockSpawn).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      "Opening a browser is not supported on freebsd."
    );
    expect(process.exitCode).toBe(1);
  });

  it("should report browser launch errors", () => {
    setPlatform("linux");

    openUrl(exampleUrl);

    const errorHandler = mockChild.on.mock.calls.find(([event]) => event === "error")?.[1];
    expect(errorHandler).toBeTypeOf("function");
    errorHandler?.(new Error("launcher not found"));

    expect(console.error).toHaveBeenCalledWith("Could not open the browser: launcher not found");
    expect(process.exitCode).toBe(1);
  });
});
