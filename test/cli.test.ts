import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSimulator = {
  listen: vi.fn().mockResolvedValue("http://127.0.0.1:8787"),
  close: vi.fn().mockResolvedValue(undefined)
};

const mockCreateSimulator = vi.fn().mockReturnValue(mockSimulator);

vi.mock("~/simulator", () => ({
  createSimulator: mockCreateSimulator
}));

describe("cli", () => {
  const originalArgv = process.argv;

  beforeEach(() => {
    vi.resetModules();
    mockCreateSimulator.mockClear();
    mockSimulator.listen.mockClear().mockResolvedValue("http://127.0.0.1:8787");
    mockSimulator.close.mockClear();
  });

  afterEach(() => {
    process.argv = originalArgv;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("should do nothing when no command is provided", async () => {
    process.argv = ["node", "cli.ts"];
    await import("~/cli");
    expect(mockCreateSimulator).not.toHaveBeenCalled();
  });

  it("should do nothing for unknown commands", async () => {
    process.argv = ["node", "cli.ts", "unknown"];
    await import("~/cli");
    expect(mockCreateSimulator).not.toHaveBeenCalled();
  });

  describe("simulate command", () => {
    it("should start simulator with default options", async () => {
      process.argv = ["node", "cli.ts", "simulate"];
      await import("~/cli");

      expect(mockCreateSimulator).toHaveBeenCalledWith({
        host: undefined,
        port: undefined,
        silent: false
      });
      expect(mockSimulator.listen).toHaveBeenCalled();
    });

    it("should use --port flag", async () => {
      process.argv = ["node", "cli.ts", "simulate", "--port", "9000"];
      await import("~/cli");

      expect(mockCreateSimulator).toHaveBeenCalledWith({
        host: undefined,
        port: 9000,
        silent: false
      });
    });

    it("should use --host flag", async () => {
      process.argv = ["node", "cli.ts", "simulate", "--host", "0.0.0.0"];
      await import("~/cli");

      expect(mockCreateSimulator).toHaveBeenCalledWith({
        host: "0.0.0.0",
        port: undefined,
        silent: false
      });
    });

    it("should disable logging with --silent flag", async () => {
      process.argv = ["node", "cli.ts", "simulate", "--silent"];
      await import("~/cli");

      expect(mockCreateSimulator).toHaveBeenCalledWith({
        host: undefined,
        port: undefined,
        silent: true
      });
    });

    it("should use MAILCHANNELS_SIMULATOR_PORT env var as default port", async () => {
      vi.stubEnv("MAILCHANNELS_SIMULATOR_PORT", "7000");
      process.argv = ["node", "cli.ts", "simulate"];
      await import("~/cli");

      expect(mockCreateSimulator).toHaveBeenCalledWith({
        host: undefined,
        port: 7000,
        silent: false
      });
    });

    it("should use MAILCHANNELS_SIMULATOR_HOST env var as default host", async () => {
      vi.stubEnv("MAILCHANNELS_SIMULATOR_HOST", "0.0.0.0");
      process.argv = ["node", "cli.ts", "simulate"];
      await import("~/cli");

      expect(mockCreateSimulator).toHaveBeenCalledWith({
        host: "0.0.0.0",
        port: undefined,
        silent: false
      });
    });

    it("should exit with error for invalid port", async () => {
      const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
        throw new Error(`process.exit:${code}`);
      }) as never);
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

      process.argv = ["node", "cli.ts", "simulate", "--port", "a"];

      await expect(import("~/cli")).rejects.toThrow("process.exit:1");
      expect(errorSpy).toHaveBeenCalledWith(
        "[MailChannels-CLI]",
        "[Simulator]",
        "Invalid port \"a\": must be an integer between 0 and 65535."
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(mockCreateSimulator).not.toHaveBeenCalled();
    });

    it("should register SIGTERM handler that closes simulator and exits", async () => {
      const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
      const onSpy = vi.spyOn(process, "on");

      process.argv = ["node", "cli.ts", "simulate"];
      await import("~/cli");

      const sigtermCall = onSpy.mock.calls.find(([event]) => event === "SIGTERM");
      expect(sigtermCall).toBeDefined();
      const sigtermHandler = sigtermCall![1] as () => Promise<void>;
      await sigtermHandler();

      expect(mockSimulator.close).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(0);
    });
  });
});
