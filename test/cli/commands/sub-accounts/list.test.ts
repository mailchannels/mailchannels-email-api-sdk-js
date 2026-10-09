import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import list from "~/cli/commands/sub-accounts/list";
import { tabulatedSections } from "~/cli/utils/shared/sections";
import { styleText } from "~/cli/utils/shared/style";
import type { SubAccountsListResponse } from "~/types/sub-accounts/list";

const fake = {
  args: [
    "--api-key", "test-api-key",
    "--limit", "25",
    "--offset", "10"
  ],
  options: {
    limit: 25,
    offset: 10
  },
  response: {
    data: [{
      companyName: "Acme Corp",
      enabled: true,
      handle: "acme"
    }],
    error: null
  } satisfies SubAccountsListResponse
};

const mockList = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  SubAccounts: class { list = mockList; }
}));

describe("list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should list sub-accounts with pagination", async () => {
    await runCommand(list, { rawArgs: fake.args });

    expect(mockList).toHaveBeenCalledWith(fake.options);
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("[Sub-Accounts] Retrieved sub-accounts:"
        + tabulatedSections(fake.response.data)
      )
    );
    expect(console.info).toHaveBeenCalledWith(
      "[Sub-Accounts] Total sub-accounts retrieved:", fake.response.data.length,
      `(with limit: ${styleText("yellow", String(fake.options.limit))}, offset: ${styleText("yellow", String(fake.options.offset))})`
    );
  });

  it("should use default pagination when no options are provided", async () => {
    await runCommand(list, { rawArgs: ["--api-key", "test-api-key"] });

    expect(mockList).toHaveBeenCalledWith({ limit: undefined, offset: undefined });
    expect(console.info).toHaveBeenCalledWith(
      "[Sub-Accounts] Total sub-accounts retrieved:", fake.response.data.length,
      `(with limit: ${styleText("yellow", "1000")}, offset: ${styleText("yellow", "0")})`
    );
  });

  it("should report when no sub-accounts are found", async () => {
    mockList.mockResolvedValueOnce({ data: [], error: null });

    await runCommand(list, { rawArgs: fake.args });

    expect(console.info).toHaveBeenCalledWith("[Sub-Accounts] No sub-accounts found.");
  });

  it("should exit with error when listing sub-accounts fails", async () => {
    mockList.mockResolvedValueOnce({ data: null, error: { message: "API Error" } });

    await expect(
      runCommand(list, { rawArgs: fake.args })
    ).rejects.toThrow();
  });
});
