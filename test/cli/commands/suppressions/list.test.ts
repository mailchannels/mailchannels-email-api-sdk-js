import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import suppressions from "~/cli/commands/suppressions";
import type { SuppressionsListResponse } from "~/types/suppressions/list";

// @ts-expect-error defineCommand does not handle well sub command types
const list = await suppressions.subCommands?.list;

const fake = {
  args: [
    "--api-key", "test-api-key",
    "--recipient", "recipient@example.com",
    "--source", "api",
    "--created-after", "2026-06-01",
    "--created-before", "2026-06-15",
    "--limit", "25",
    "--offset", "5"
  ],
  options: {
    recipient: "recipient@example.com",
    source: "api",
    createdAfter: "2026-06-01",
    createdBefore: "2026-06-15",
    limit: 25,
    offset: 5
  },
  response: {
    data: [
      {
        createdAt: "2026-06-10T15:51:28.071Z",
        notes: "Test suppression",
        recipient: "recipient@example.com",
        sender: "sender@example.com",
        source: "api",
        types: ["non-transactional"]
      }
    ],
    error: null
  } satisfies SuppressionsListResponse
};

const mockList = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  Suppressions: class { list = mockList; }
}));

describe("list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockClear();
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should list suppression entries with parsed filters and pagination", async () => {
    await runCommand(list, { rawArgs: fake.args });

    expect(mockList).toHaveBeenCalledWith(fake.options);
  });

  it("should use default pagination when it is not provided", async () => {
    await runCommand(list, { rawArgs: ["--api-key", "test-api-key"] });

    expect(mockList).toHaveBeenCalledWith({
      limit: undefined,
      offset: undefined
    });
  });

  it("should report when no suppression entries are found", async () => {
    mockList.mockResolvedValueOnce({ data: [], error: null });

    await runCommand(list, { rawArgs: fake.args });
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("No suppression entries found.")
    );
  });

  it("should exit with error on API list failure", async () => {
    mockList.mockResolvedValueOnce({ error: { message: "API Error" } });

    await expect(
      runCommand(list, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
