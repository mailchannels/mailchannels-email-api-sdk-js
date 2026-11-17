import { type SpawnSyncReturns, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const fake = {
  repository: "https://github.com/mailchannels/mailchannels-email-api-sdk-js",
  releaseTag: "v1.0.0",
  latestTag: "v0.0.0",
  executable: "#!/bin/sh\nprintf '%s\\n' 'fixture-cli'\n",
  checksumName: "mailchannels-cli-checksums.txt",
  curl: String.raw`#!/bin/sh
set -eu
while [ "$#" -gt 1 ]; do
  case "$1" in
    -o) output=$2; shift 2 ;;
    *) shift ;;
  esac
done
printf '%s\n' "$1" >> "$FAKE_ASSETS/requests"
asset=$(basename "$1")
if [ "$asset" = "$FAKE_FAILED_DOWNLOAD" ]; then exit 22; fi
case "$1" in
  */releases/latest) printf '%s' "$FAKE_LATEST_URL" ;;
  */releases/download/*) cp "$FAKE_ASSETS/$asset" "$output" ;;
  *) exit 22 ;;
esac
`,
  uname: String.raw`#!/bin/sh
case "$1" in
  -s) printf '%s\n' "$FAKE_PLATFORM" ;;
  -m) printf '%s\n' "$FAKE_MACHINE" ;;
  *) exit 1 ;;
esac
`,
  sysctl: String.raw`#!/bin/sh
[ "$*" = "-n sysctl.proc_translated" ] || exit 1
printf '%s\n' "$FAKE_TRANSLATED"
`,
  ldd: String.raw`#!/bin/sh
[ "$1" = "--version" ] || exit 1
printf '%s\n' "$FAKE_LIBC"
`
};

const installScript = fileURLToPath(new URL("../../src/cli/install.sh", import.meta.url));
const isSupported = process.platform === "darwin" || process.platform === "linux";
const archiveName = "mailchannels-linux-x64.tar.gz";

const run = (
  command: string,
  args: string[],
  env?: NodeJS.ProcessEnv
): SpawnSyncReturns<string> => {
  const result = spawnSync(command, args, { env, encoding: "utf8", timeout: 5_000 });
  if (result.error) {
    throw result.error;
  }
  return result;
};

describe.skipIf(!isSupported)("CLI installer", () => {
  let root: string;
  let homeDirectory: string;
  let assets: string;
  let workDirectory: string;
  let installerEnv: NodeJS.ProcessEnv;

  const runInstaller = (
    args: string[] = [],
    env: NodeJS.ProcessEnv = {}
  ): SpawnSyncReturns<string> =>
    run("/bin/bash", [installScript, ...args], { ...installerEnv, ...env });

  const expectInstalled = (binDirectory: string): void => {
    const result = run(join(binDirectory, "mailchannels"), [], installerEnv);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toBe("fixture-cli\n");
    expect(readdirSync(binDirectory)).toEqual(["mailchannels"]);
    expect(readdirSync(workDirectory)).toEqual([]);
  };

  const bashProfiles = (): string[] =>
    [".bashrc", ".profile"].map(name => join(homeDirectory, name));

  const requestLog = (): string[] =>
    readFileSync(join(assets, "requests"), "utf8").trim().split("\n");

  const writeReleaseArchive = (name: string): void => {
    const archivePath = join(assets, name);
    const archive = run("/usr/bin/tar", [
      "-czf", archivePath, "-C", join(root, "payload"), "mailchannels"
    ]);
    expect(archive.status, archive.stderr).toBe(0);
    const checksum = createHash("sha256").update(readFileSync(archivePath)).digest("hex");
    writeFileSync(join(assets, fake.checksumName), checksum + " *" + name + "\n");
  };

  const sourceBashProfile = (profile: string): SpawnSyncReturns<string> => run("/bin/bash", [
    "-ec",
    ". \"$1\"; . \"$1\"; printf \"%s\\n\" \"$PATH\"",
    "installer-test",
    profile
  ], installerEnv);

  beforeEach(() => {
    root = mkdtempSync(join(realpathSync(tmpdir()), "mailchannels-install-"));
    homeDirectory = join(root, "home");
    assets = join(root, "assets");
    workDirectory = join(root, "work");
    const commandDirectory = join(root, "commands");
    const payloadDirectory = join(root, "payload");
    for (const path of [homeDirectory, assets, workDirectory, commandDirectory, payloadDirectory]) {
      mkdirSync(path);
    }

    for (const command of ["curl", "uname", "sysctl", "ldd"] as const) {
      writeFileSync(join(commandDirectory, command), fake[command], { mode: 0o755 });
    }
    writeFileSync(join(payloadDirectory, "mailchannels"), fake.executable);
    writeReleaseArchive(archiveName);

    installerEnv = {
      PATH: commandDirectory + ":" + (process.env.PATH ?? "/usr/bin:/bin"),
      HOME: homeDirectory,
      SHELL: "/bin/bash",
      TMPDIR: workDirectory,
      NO_COLOR: "1",
      FAKE_PLATFORM: "Linux",
      FAKE_MACHINE: "x86_64",
      FAKE_TRANSLATED: "0",
      FAKE_LIBC: "ldd (GNU libc)",
      FAKE_ASSETS: assets,
      FAKE_FAILED_DOWNLOAD: "",
      FAKE_LATEST_URL: fake.repository + "/releases/tag/" + fake.latestTag
    };
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("resolves the latest release and installs a runnable CLI in the default directory", () => {
    const result = runInstaller();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain(`MailChannels-CLI ${fake.latestTag} installed successfully!`);
    expectInstalled(join(homeDirectory, ".mailchannels", "bin"));
    const release = fake.repository + "/releases/download/" + fake.latestTag;
    expect(requestLog()).toEqual([
      fake.repository + "/releases/latest",
      release + "/" + archiveName,
      release + "/" + fake.checksumName
    ]);
  });

  it.each([
    {
      platform: "Linux",
      machine: "aarch64",
      target: "linux-arm64",
      profiles: [".bashrc", ".profile"]
    },
    { platform: "Darwin", machine: "x86_64", target: "darwin-x64", profiles: [".bash_profile"] },
    { platform: "Darwin", machine: "arm64", target: "darwin-arm64", profiles: [".bash_profile"] },
    {
      platform: "Darwin",
      machine: "x86_64",
      translated: "1",
      target: "darwin-arm64",
      profiles: [".bash_login"]
    }
  ])("selects $target and configures Bash on simulated $platform ($machine)", (host) => {
    const targetArchive = `mailchannels-${host.target}.tar.gz`;
    writeReleaseArchive(targetArchive);
    if (host.profiles.includes(".bash_login")) {
      writeFileSync(join(homeDirectory, ".bash_login"), "# Existing login profile\n");
    }

    const result = runInstaller(["--version=1.0.0"], {
      FAKE_PLATFORM: host.platform,
      FAKE_MACHINE: host.machine,
      FAKE_TRANSLATED: host.translated ?? "0"
    });

    expect(result.status, result.stderr).toBe(0);
    const release = fake.repository + "/releases/download/" + fake.releaseTag;
    expect(requestLog()).toEqual([
      release + "/" + targetArchive,
      release + "/" + fake.checksumName
    ]);
    expect(readdirSync(homeDirectory).sort()).toEqual([".mailchannels", ...host.profiles].sort());
    const binDirectory = join(homeDirectory, ".mailchannels", "bin");
    for (const profile of host.profiles) {
      const sourced = sourceBashProfile(join(homeDirectory, profile));
      expect(sourced.status, sourced.stderr).toBe(0);
      expect(sourced.stdout.trimEnd()).toBe(binDirectory + ":" + installerEnv.PATH);
    }
    expectInstalled(binDirectory);
  });

  it("rejects simulated musl Linux before making a download request", () => {
    const result = runInstaller([], { FAKE_LIBC: "musl libc" });

    expect(result.status, result.stderr).toBe(1);
    expect(result.stderr).toContain("requires glibc");
    expect(existsSync(join(assets, "requests"))).toBe(false);
    expect(readdirSync(homeDirectory)).toEqual([]);
  });

  it("replaces an existing executable using the requested release", () => {
    const binDirectory = join(homeDirectory, ".mailchannels", "bin");
    mkdirSync(binDirectory, { recursive: true });
    writeFileSync(join(binDirectory, "mailchannels"), "previous installation\n");

    const result = runInstaller(["--version", "V1.0.0"]);

    expect(result.status, result.stderr).toBe(0);
    expectInstalled(binDirectory);
    const release = fake.repository + "/releases/download/" + fake.releaseTag;
    expect(requestLog()).toEqual([release + "/" + archiveName, release + "/" + fake.checksumName]);
  });

  it.each([
    {
      name: "checksum mismatch",
      checksumEntry: "0".repeat(64) + "  " + archiveName,
      message: "Checksum verification failed"
    },
    {
      name: "missing checksum entry",
      checksumEntry: "0".repeat(64) + "  other-archive.tar.gz",
      message: "does not contain a valid SHA-256 entry"
    },
    {
      name: "archive download failure",
      failedDownload: archiveName,
      message: "Could not download " + fake.releaseTag
    },
    {
      name: "checksum download failure",
      failedDownload: fake.checksumName,
      message: "Could not download the release checksums"
    }
  ])("preserves the existing install after $name", (failure) => {
    const binDirectory = join(homeDirectory, ".mailchannels", "bin");
    mkdirSync(binDirectory, { recursive: true });
    const executable = join(binDirectory, "mailchannels");
    writeFileSync(executable, "previous installation\n", { mode: 0o755 });

    if (failure.checksumEntry) {
      writeFileSync(join(assets, fake.checksumName), failure.checksumEntry + "\n");
    }

    const result = runInstaller(["--version=1.0.0"], {
      FAKE_FAILED_DOWNLOAD: failure.failedDownload ?? ""
    });

    expect(result.status, result.stderr).toBe(1);
    expect(result.stderr).toContain(failure.message);
    expect(readFileSync(executable, "utf8")).toBe("previous installation\n");
    expect(readdirSync(binDirectory)).toEqual(["mailchannels"]);
    expect(readdirSync(workDirectory)).toEqual([]);
    expect(bashProfiles().some(path => existsSync(path))).toBe(false);
  });

  it("rejects invalid version arguments before making a download request", () => {
    const result = runInstaller(["--version", "-latest"]);

    expect(result.status, result.stderr).toBe(1);
    expect(result.stderr).toContain("Usage:");
    expect(existsSync(join(assets, "requests"))).toBe(false);
  });

  it("sources Bash PATH entries for a custom path with spaces and apostrophes", () => {
    const installRoot = join(root, "Name's\\ $HOME; CLI");
    const binDirectory = join(installRoot, "bin");
    const env = { MAILCHANNELS_INSTALL: installRoot };
    const profiles = bashProfiles();
    for (const profile of profiles) {
      writeFileSync(profile, "# Existing profile\n");
    }

    const first = runInstaller([], env);
    expect(first.status, first.stderr).toBe(0);
    expectInstalled(binDirectory);
    const configuredProfiles = profiles.map(profile => readFileSync(profile, "utf8"));

    const second = runInstaller([], env);
    expect(second.status, second.stderr).toBe(0);
    expect(profiles.map(profile => readFileSync(profile, "utf8"))).toEqual(configuredProfiles);

    for (const profile of profiles) {
      expect(readFileSync(profile, "utf8")).toMatch(/^# Existing profile\n/);
      const result = sourceBashProfile(profile);
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout.trimEnd()).toBe(binDirectory + ":" + installerEnv.PATH);
    }
  });

  it.each(["default", "custom"])("passes the %s install path to a simulated fish shell", (kind) => {
    const custom = kind === "custom";
    const installRoot = custom
      ? join(root, "Name's\\ $HOME; CLI")
      : join(homeDirectory, ".mailchannels");
    const binDirectory = join(installRoot, "bin");
    const configDirectory = custom ? join(root, "fish-config") : join(homeDirectory, ".config");
    const install = runInstaller([], {
      SHELL: "fish",
      ...(custom && { MAILCHANNELS_INSTALL: installRoot, XDG_CONFIG_HOME: configDirectory })
    });
    expect(install.status, install.stderr).toBe(0);
    const profile = join(configDirectory, "fish", "conf.d", "mailchannels.fish");
    // Capture the path fish_add_path receives after parsing the generated fish quoting.
    const result = run("/bin/bash", [
      "-ec",
      String.raw`fish_add_path() {
  [ "$#" -eq 1 ] && printf '%s\n' "$1"
}
. "$1"`,
      "installer-test",
      profile
    ], installerEnv);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trimEnd()).toBe(binDirectory);
    expectInstalled(binDirectory);
  });
});
