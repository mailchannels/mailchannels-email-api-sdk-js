import { getChangelog } from "./changelog-list-md";

const MODULE_MIN_VERSIONS: Record<string, string> = {
  domains: "v0.8.0"
};

export const addChangelog = (src: string, module: string): string => {
  const moduleChangelog = getChangelog(`src/modules/${module}.ts`, MODULE_MIN_VERSIONS[module]);

  const changelogSection = `\n## Changelog\n\n${moduleChangelog}\n`;
  return src + changelogSection;
};
