import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { type CommandDef, runCommand, showUsage } from "citty";
import { version } from "../../package.json";

const { mockCheckUpdate, mockRunMain } = vi.hoisted(() => ({
  mockCheckUpdate: vi.fn().mockResolvedValue(undefined),
  mockRunMain: vi.fn()
}));

type CittyModule = Record<string, unknown> & {
  showUsage: typeof showUsage;
};

vi.mock("citty", async (importOriginal) => {
  const citty = await importOriginal<CittyModule>();
  return {
    ...citty,
    runMain: mockRunMain,
    showUsage: vi.fn(citty.showUsage as typeof showUsage)
  };
});

vi.mock("~/cli/utils/shared/check-update", () => ({
  checkUpdate: mockCheckUpdate
}));

const originalArgv = process.argv;
let rootCommand: CommandDef | undefined;

beforeAll(async () => {
  process.argv = ["node", "mailchannels"];
  await import("~/cli/index");
  rootCommand = mockRunMain.mock.calls[0]?.[0] as CommandDef | undefined;
});

afterAll(() => {
  process.argv = originalArgv;
});

async function invokeRootCommand (
  argv: string[],
  dispatchCommand = false
) {
  process.argv = argv;
  if (!rootCommand?.run) {
    throw new Error("Expected runMain to receive the root command");
  }

  if (dispatchCommand) {
    await runCommand(rootCommand, { rawArgs: argv.slice(2) });
    return;
  }

  await rootCommand.run({} as Parameters<NonNullable<typeof rootCommand.run>>[0]);
}

describe("CLI entry point", () => {
  beforeEach(() => {
    mockCheckUpdate.mockClear();
    vi.mocked(showUsage).mockClear();
  });

  afterEach(() => {
    process.argv = originalArgv;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows root help and skips the update check without arguments", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    await invokeRootCommand(["node", "mailchannels"]);

    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining("USAGE @mailchannels/sdk"));
    expect(showUsage).toHaveBeenCalledOnce();
    expect(showUsage).toHaveBeenCalledWith(rootCommand);
    expect(mockCheckUpdate).not.toHaveBeenCalled();
  });

  it("checks for updates when invoked with arguments", async () => {
    await invokeRootCommand(["node", "mailchannels", "usage"]);

    expect(showUsage).not.toHaveBeenCalled();
    expect(mockCheckUpdate).toHaveBeenCalledOnce();
  });

  it("sends distinct User-Agent headers for CLI and SDK requests in the same process", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ total_usage: 1, monthly_limit: 3000 }))
      .mockResolvedValueOnce(Response.json({}));

    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    await invokeRootCommand(["node", "mailchannels", "usage", "--api-key", "test-api-key"], true);

    const headers = fetchMock.mock.calls[0]?.[1]?.headers;
    const userAgent = new Headers(headers).get("user-agent");

    expect(userAgent).toEqual(`mailchannels-cli/${version}`);
  });
});
