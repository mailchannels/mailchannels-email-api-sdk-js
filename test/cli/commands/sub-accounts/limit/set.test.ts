import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "citty";
import type { SuccessResponse } from "~/types/responses";
import set from "~/cli/commands/sub-accounts/limit/set";

const fake = {
  args: ["--api-key", "test-api-key"],
  handle: "acme",
  sends: 5000,
  response: {
    success: true,
    error: null
  } satisfies SuccessResponse
};

const mockSet = vi.fn().mockResolvedValue(fake.response);

vi.mock("~/mailchannels", async () => ({
  ...(await vi.importActual("~/mailchannels")),
  MailChannelsClient: class {},
  SubAccounts: class { limits = { set: mockSet }; }
}));

describe("limits set", () => {
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

  it.each(
    [fake.sends, 0, "+1", "1.00"]
  )("should set a sub-account limit of %i sends", async (sends) => {
    await runCommand(set, {
      rawArgs: [...fake.args, "--handle", fake.handle, "--sends", String(sends)]
    });

    expect(mockSet).toHaveBeenCalledWith(fake.handle, { sends: Number(sends) });
  });

  it.each([
    { input: "a bare flag", args: ["--sends"] },
    { input: "an empty value", args: ["--sends", ""] },
    { input: "an empty inline value", args: ["--sends="] },
    { input: "whitespace", args: ["--sends", "  "] },
    { input: "a negated flag", args: ["--no-sends"] },
    { input: "a fraction", args: ["--sends", "1.5"] },
    { input: "non-decimal notation", args: ["--sends", "0x10"] }
  ])("should reject $input for sends before calling the SDK", async ({ args }) => {
    await expect(
      runCommand(set, { rawArgs: [...fake.args, "--handle", fake.handle, ...args] })
    ).rejects.toThrow();

    expect(mockSet).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      "[Sub-Accounts] '--sends' must be an integer value."
    );
  });

  it("should exit with error when setting a sub-account limit fails", async () => {
    mockSet.mockResolvedValueOnce({ success: false, error: { message: "API Error" } });

    await expect(
      runCommand(set, {
        rawArgs: [...fake.args, "--handle", fake.handle, "--sends", String(fake.sends)]
      })
    ).rejects.toThrow();
  });
});
