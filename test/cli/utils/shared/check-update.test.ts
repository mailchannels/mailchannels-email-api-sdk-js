import { afterEach, describe, expect, it, vi } from "vitest";
import pkg from "../../../../package.json";
import { checkUpdate } from "~/cli/utils/shared/check-update";
import { styleText } from "~/cli/utils/shared/style";

const repoUrl = "https://github.com/mailchannels/mailchannels-email-api-sdk-js";
const installerUrl = `${repoUrl}/raw/main/src/cli`;
const releaseUrl = `${repoUrl}/releases/latest`;

describe("checkUpdate", () => {
  const stdoutTTYDescriptor = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");
  const platformDescriptor = Object.getOwnPropertyDescriptor(process, "platform");
  const pkgDescriptor = Object.getOwnPropertyDescriptor(process, "pkg");

  const [currentMajor, currentMinor, currentPatch] = pkg.version.split(".").map(Number) as [
    number,
    number,
    number
  ];
  const originalEnvironment = {
    CI: process.env.CI,
    NO_UPDATE: process.env.NO_UPDATE,
    GITHUB_ACTIONS: process.env.GITHUB_ACTIONS
  };

  const enableUpdateChecks = () => {
    Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: true });
    delete process.env.CI;
    delete process.env.NO_UPDATE;
    delete process.env.GITHUB_ACTIONS;
  };

  const mockLatestVersion = (version: string) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version })
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  };

  const setRuntime = (platform: NodeJS.Platform, packaged: boolean) => {
    Object.defineProperty(process, "platform", { configurable: true, value: platform });
    if (packaged) {
      Object.defineProperty(process, "pkg", { configurable: true, value: {} });
    }
    else {
      Reflect.deleteProperty(process, "pkg");
    }
  };

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();

    if (stdoutTTYDescriptor) {
      Object.defineProperty(process.stdout, "isTTY", stdoutTTYDescriptor);
    }
    else {
      Reflect.deleteProperty(process.stdout, "isTTY");
    }

    if (platformDescriptor) {
      Object.defineProperty(process, "platform", platformDescriptor);
    }
    else {
      Reflect.deleteProperty(process, "platform");
    }

    if (pkgDescriptor) {
      Object.defineProperty(process, "pkg", pkgDescriptor);
    }
    else {
      Reflect.deleteProperty(process, "pkg");
    }

    for (const key of ["CI", "NO_UPDATE", "GITHUB_ACTIONS"] as const) {
      const value = originalEnvironment[key];
      if (value === undefined) {
        delete process.env[key];
      }
      else {
        process.env[key] = value;
      }
    }
  });

  it("should print update info when a newer version is available", async () => {
    enableUpdateChecks();
    setRuntime("win32", false);

    const fetchMock = mockLatestVersion(`${currentMajor}.${currentMinor}.${currentPatch + 1}`);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await checkUpdate();

    expect(fetchMock).toHaveBeenCalled();
    expect(stderrWrite).toHaveBeenCalledWith(
      expect.stringContaining(styleText("cyan", "npm install -g @mailchannels/sdk"))
    );
    expect(stderrWrite).toHaveBeenCalledWith(
      expect.stringContaining(styleText("cyan", "npx @mailchannels/sdk@latest"))
    );
  });

  it.each([
    {
      platform: "win32",
      installCommand: `irm ${installerUrl}/install.ps1 | iex`
    },
    {
      platform: "darwin",
      installCommand: `curl -fsSL ${installerUrl}/install.sh | bash`
    },
    {
      platform: "linux",
      installCommand: `curl -fsSL ${installerUrl}/install.sh | bash`
    }
  ])("should show the standalone installer for $platform", async ({ platform, installCommand }) => {
    enableUpdateChecks();
    setRuntime(platform as NodeJS.Platform, true);
    mockLatestVersion(`${currentMajor}.${currentMinor}.${currentPatch + 1}`);
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await checkUpdate();

    expect(stderrWrite).toHaveBeenCalledWith(
      expect.stringContaining(`Install: ${styleText("cyan", installCommand)}`)
    );
    expect(stderrWrite).toHaveBeenCalledWith(
      expect.stringContaining(`Or download from ${styleText("cyan", releaseUrl)}`)
    );
  });

  it("should use npm for unsupported standalone platforms", async () => {
    enableUpdateChecks();
    setRuntime("freebsd", true);
    mockLatestVersion(`${currentMajor}.${currentMinor}.${currentPatch + 1}`);
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await checkUpdate();

    expect(stderrWrite).toHaveBeenCalledWith(
      expect.stringContaining(
        styleText("cyan", "npm install -g @mailchannels/sdk")
      )
    );
    expect(stderrWrite).toHaveBeenCalledWith(
      expect.stringContaining(
        styleText("cyan", "npx @mailchannels/sdk@latest")
      )
    );
  });

  it.each([
    { kind: "major", version: `${currentMajor + 1}.0.0` },
    { kind: "minor", version: `${currentMajor}.${currentMinor + 1}.0` },
    { kind: "patch", version: `${currentMajor}.${currentMinor}.${currentPatch + 1}` }
  ])("should report a newer $kind version", async ({ version }) => {
    enableUpdateChecks();
    mockLatestVersion(version);
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await checkUpdate();

    expect(stderrWrite).toHaveBeenCalledWith(expect.stringContaining(`v${version}`));
  });

  it("should not report an update when the latest version is unchanged", async () => {
    enableUpdateChecks();
    mockLatestVersion(pkg.version);
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await checkUpdate();

    expect(stderrWrite).not.toHaveBeenCalled();
  });

  it.each([
    { name: "a non-OK response", ok: false, result: { version: "2.0.0" } },
    { name: "a non-object response body", ok: true, result: "invalid" },
    { name: "a null response body", ok: true, result: null },
    { name: "a non-string version", ok: true, result: { version: 2 } }
  ])("should not report an update for $name", async ({ ok, result }) => {
    enableUpdateChecks();
    const fetchMock = vi.fn().mockResolvedValue({
      ok,
      json: async () => result
    });
    vi.stubGlobal("fetch", fetchMock);
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await checkUpdate();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(stderrWrite).not.toHaveBeenCalled();
  });

  it("should skip the check when running in GitHub Actions", async () => {
    enableUpdateChecks();
    process.env.GITHUB_ACTIONS = "true";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await checkUpdate();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("should silently skip when fetching the latest version fails", async () => {
    enableUpdateChecks();
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await checkUpdate();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(stderrWrite).not.toHaveBeenCalled();
  });
});
