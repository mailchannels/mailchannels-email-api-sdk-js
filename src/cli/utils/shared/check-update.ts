import pkg from "../../../../package.json";
import { styleText } from "./style";

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

const fetchLatestVersion = async () => {
  try {
    const response = await fetch(`https://registry.npmjs.org/${pkg.name}/latest`, {
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) return null;

    const result = await response.json() as Record<string, unknown>;
    if (typeof result !== "object" || result === null) return null;

    const latestVersion = result.version;
    if (typeof latestVersion !== "string") return null;

    return latestVersion;
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

  const latestVersion = await fetchLatestVersion();
  if (!latestVersion) return;

  if (isNewerVersion(pkg.version, latestVersion)) {
    const messageLines = [
      `Update available: ${styleText("yellow", "v" + pkg.version)} -> ${styleText("cyan", "v" + latestVersion)}`,
      `Install globally: ${styleText("cyan", `npm install -g ${pkg.name}`)}`,
      `Or run with npx: ${styleText("cyan", `npx ${pkg.name}@latest`)}`
    ];

    process.stderr.write(`\n${styleText("dim", messageLines.join("\n"))}`);
  }
};
