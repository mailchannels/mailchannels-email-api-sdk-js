import pkg from "../../../../package.json";
import { styleText } from "./style";

interface PackageMetadata {
  "dist-tags": {
    latest: string;
  };
  "versions": {
    [version: string]: {
      deprecated?: string;
    };
  };
}

const isNewerVersion = (local: string, remote: string) => {
  const parse = (v: string) => v.replace(/^v/, "").split(".").map(Number) as [
    number,
    number,
    number
  ];
  const [localMaj, localMin, localPatch] = parse(local);
  const [remoteMaj, remoteMin, remotePatch] = parse(remote);

  if (remoteMaj !== localMaj) {
    return remoteMaj > localMaj;
  }

  if (remoteMin !== localMin) {
    return remoteMin > localMin;
  }

  return remotePatch > localPatch;
};

const fetchUpdateMetadata = async () => {
  try {
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg.name)}`, {
      headers: { Accept: "application/vnd.npm.install-v1+json" },
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return null;

    const result = await response.json() as PackageMetadata;
    if (typeof result !== "object"
      || result === null
      || !("dist-tags" in result)
      || !("versions" in result)
    ) return null;

    return {
      latestVersion: result["dist-tags"].latest,
      deprecationNotice: result.versions[pkg.version]?.deprecated
    };
  }
  catch {
    // Update checks are best-effort; offline use should not affect the CLI.
    return null;
  }
};

export const checkUpdate = async () => {
  if (!process.stdout.isTTY
    || process.env.CI
    || process.env.NO_UPDATE
    || process.env.GITHUB_ACTIONS
  ) return;

  const metadata = await fetchUpdateMetadata();
  if (!metadata) return;

  const { deprecationNotice, latestVersion } = metadata;
  const notices: string[] = [];

  if (deprecationNotice) {
    notices.push(
      `Version v${pkg.version} is deprecated: ${styleText("yellow", deprecationNotice)}`
    );
  }

  if (latestVersion && isNewerVersion(pkg.version, latestVersion)) {
    const updateNotices = [
      `Update available: ${styleText("yellow", "v" + pkg.version)} -> ${styleText("cyan", "v" + latestVersion)}`
    ];

    const isPackaged = "pkg" in process;
    const platform = process.platform;
    const isStandalone = isPackaged && (["win32", "darwin", "linux"].includes(platform));

    if (isStandalone) {
      const repoUrl = "https://github.com/mailchannels/mailchannels-email-api-sdk-js";
      const installerUrl = `${repoUrl}/raw/main/src/cli`;

      const installCommand = platform === "win32"
        ? `irm ${installerUrl}/install.ps1 | iex`
        : `curl -fsSL ${installerUrl}/install.sh | bash`;
      updateNotices.push(
        `Install: ${styleText("cyan", installCommand)}`,
        `Or download from ${styleText("cyan", `${repoUrl}/releases/latest`)}`
      );
    }
    else {
      updateNotices.push(
        `Install globally: ${styleText("cyan", `npm install -g ${pkg.name}`)}`,
        `Or run with npx: ${styleText("cyan", `npx ${pkg.name}@latest`)}`
      );
    }

    notices.push(updateNotices.join("\n"));
  }

  if (notices.length) {
    process.stderr.write(`\n${styleText("dim", notices.join("\n"))}\n`);
  }
};
