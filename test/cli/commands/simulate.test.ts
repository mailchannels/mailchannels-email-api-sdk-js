import { afterEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";

const mockSimulator = {
  listen: vi.fn().mockResolvedValue("http://127.0.0.1:8787"),
  close: vi.fn().mockResolvedValue(undefined)
};

const mockCreateSimulator = vi.fn().mockReturnValue(mockSimulator);

vi.mock("~/simulator", () => ({
  createSimulator: mockCreateSimulator
}));

const { default: simulate } = await import("~/cli/commands/simulate");

describe("simulate", () => {
  afterEach(() => {
    mockCreateSimulator.mockClear();
    mockSimulator.listen.mockClear();
    mockSimulator.close.mockClear();
  });

  it("should start simulator with default options", async () => {
    await runCommand(simulate, { rawArgs: [] });

    expect(mockCreateSimulator).toHaveBeenCalledWith({
      host: undefined,
      port: undefined,
      silent: false
    });
    expect(mockSimulator.listen).toHaveBeenCalled();
  });

  it("should use --port flag", async () => {
    await runCommand(simulate, { rawArgs: ["--port", "9000"] });

    expect(mockCreateSimulator).toHaveBeenCalledWith({
      host: undefined,
      port: 9000,
      silent: false
    });
  });

  it("should use --host flag", async () => {
    await runCommand(simulate, { rawArgs: ["--host", "0.0.0.0"] });

    expect(mockCreateSimulator).toHaveBeenCalledWith({
      host: "0.0.0.0",
      port: undefined,
      silent: false
    });
  });

  it("should disable logging with --silent flag", async () => {
    await runCommand(simulate, { rawArgs: ["--silent"] });

    expect(mockCreateSimulator).toHaveBeenCalledWith({
      host: undefined,
      port: undefined,
      silent: true
    });
  });

  it("should use MAILCHANNELS_SIMULATOR_PORT env var as default port", async () => {
    vi.stubEnv("MAILCHANNELS_SIMULATOR_PORT", "7000");
    await runCommand(simulate, { rawArgs: [] });

    expect(mockCreateSimulator).toHaveBeenCalledWith({
      host: undefined,
      port: 7000,
      silent: false
    });
    vi.unstubAllEnvs();
  });

  it("should use MAILCHANNELS_SIMULATOR_HOST env var as default host", async () => {
    vi.stubEnv("MAILCHANNELS_SIMULATOR_HOST", "0.0.0.0");
    await runCommand(simulate, { rawArgs: [] });

    expect(mockCreateSimulator).toHaveBeenCalledWith({
      host: "0.0.0.0",
      port: undefined,
      silent: false
    });
    vi.unstubAllEnvs();
  });

  it("should register SIGTERM handler that closes simulator and exits", async () => {
    const onSpy = vi.spyOn(process, "on");

    await runCommand(simulate, { rawArgs: [] });

    const sigtermCall = onSpy.mock.calls.find(([event]) => event === "SIGTERM");
    expect(sigtermCall).toBeDefined();
    const sigtermHandler = sigtermCall![1] as () => Promise<void>;
    await sigtermHandler();

    expect(mockSimulator.close).toHaveBeenCalled();
  });
});
