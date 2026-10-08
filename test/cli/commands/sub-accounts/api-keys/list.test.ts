import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import { styleText, toWordsKeys } from "~/cli/utils/shared/style";
import list from "~/cli/commands/sub-accounts/api-keys/list";
import type { SubAccountsApiKeysListResponse } from "~/types/sub-accounts/api-keys";

const fake = {
  args: ["--api-key", "test-api-key"],
  handle: "acme",
  options: {
    limit: 20,
    offset: 5
  },
  response: {
    data: [{ id: 123, key: "mc-sub-account-api-key" }],
    error: null
  } satisfies SubAccountsApiKeysListResponse
};

const mockList = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  SubAccounts: class { apiKeys = { list: mockList }; }
}));

describe("api-keys list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "table").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should list API keys with pagination", async () => {
    await runCommand(list, {
      rawArgs: [...fake.args, "--handle", fake.handle, "--limit", "20", "--offset", "5"]
    });

    expect(mockList).toHaveBeenCalledWith(fake.handle, { limit: 20, offset: 5 });
    expect(console.table).toHaveBeenCalledWith(
      toWordsKeys(fake.response.data)
    );
    expect(console.info).toHaveBeenCalledWith(
      "[Sub-Accounts] Total API keys retrieved:", fake.response.data.length,
      `(with limit: ${styleText("yellow", String(fake.options.limit))}, offset: ${styleText("yellow", String(fake.options.offset))})`
    );
  });

  it("should use default pagination when no options are provided", async () => {
    await runCommand(list, { rawArgs: ["--api-key", "test-api-key", "--handle", fake.handle] });

    expect(mockList).toHaveBeenCalledWith(fake.handle, { limit: undefined, offset: undefined });
    expect(console.info).toHaveBeenCalledWith(
      "[Sub-Accounts] Total API keys retrieved:", fake.response.data.length,
      `(with limit: ${styleText("yellow", "1000")}, offset: ${styleText("yellow", "0")})`
    );
  });

  it("should report when no API keys are found", async () => {
    mockList.mockResolvedValueOnce({ data: [], error: null });

    await runCommand(list, {
      rawArgs: [...fake.args, "--handle", fake.handle]
    });

    expect(console.info).toHaveBeenCalledWith("[Sub-Accounts] No API keys found for this sub-account.");
  });

  it("should exit with error when listing API keys fails", async () => {
    mockList.mockResolvedValueOnce({ data: null, error: { message: "API Error" } });

    await expect(
      runCommand(list, {
        rawArgs: [...fake.args, "--handle", fake.handle]
      })
    ).rejects.toThrow();
  });
});
