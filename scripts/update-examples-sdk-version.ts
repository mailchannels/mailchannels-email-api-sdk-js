import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pkg from "../package.json" with { type: "json" };

type PackageManifest = { dependencies?: Record<string, string> };
type DenoManifest = { imports?: Record<string, string> };
type ManifestFile = { file: string, type: "node" | "deno" };

const sdkVersion = `^${pkg.version}`;
const configs = {
  node: {
    manifest: "package.json",
    key: "dependencies" as const,
    value: sdkVersion
  },
  deno: {
    manifest: "deno.json",
    key: "imports" as const,
    value: `npm:${pkg.name}@${sdkVersion}`
  }
};

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const examplesDir = join(rootDir, "examples");

const manifestTypes = new Map(
  Object.entries(configs).map(([type, config]) => [config.manifest, type as ManifestFile["type"]])
);

const findManifestFiles = async (dir: string, depth: number = 2) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const manifests: ManifestFile[] = [];

  for (const entry of entries) {
    if (entry.isFile()) {
      const type = manifestTypes.get(entry.name);
      if (!type) continue;
      manifests.push({ file: join(dir, entry.name), type });
    }

    if (depth > 0 && entry.isDirectory() && entry.name !== "node_modules") {
      manifests.push(...(await findManifestFiles(join(dir, entry.name), depth - 1)));
    }
  }

  return manifests;
};

const manifests = await findManifestFiles(examplesDir);

const updatedFiles = await Promise.all(
  manifests.map(async (manifest) => {
    const config = configs[manifest.type];
    const file = manifest.file;
    const data: PackageManifest & DenoManifest = JSON.parse(await readFile(file, "utf8"));
    const version = data[config.key];

    if (!version
      || !(pkg.name in version)
      || version[pkg.name] === config.value
    ) return;

    version[pkg.name] = config.value;

    await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
    return relative(rootDir, file);
  })
);

if (updatedFiles.length === 0) {
  console.info(`All examples are already using '${pkg.name}' version ${sdkVersion}.`);
  process.exit(0);
}

console.info(`Updated ${updatedFiles.length} examples to use '${pkg.name}' version ${sdkVersion}:`);
