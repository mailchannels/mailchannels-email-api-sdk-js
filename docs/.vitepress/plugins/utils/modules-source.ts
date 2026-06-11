import { camelCase } from "scule";
import { getMethodLineNumber, getModuleSubclassSlugs } from "./methods-line-number";
import { SITE } from "../../site";

const URL = `${SITE.repo}/src/main`;

export const addSourceLinks = (src: string, module: string, slug: string): string => {
  let sourceUrl = `${URL}/src/modules/${module}/index.ts`;
  let playgroundUrl = `${URL}/playground/${module}`;
  let docsUrl = `${URL}/docs/modules/${module}/${slug}.md`;
  let testsUrl = `${URL}/test/modules/${module}`;

  if (slug !== "index") {
    playgroundUrl += `/${slug}.ts`;
    testsUrl += `/${slug}.test.ts`;
    const subclasses = getModuleSubclassSlugs(module);
    const subclassMatch = subclasses.length > 0 ? slug.match(new RegExp(`^(${subclasses.join("|")})-`)) : null;
    const methodName = camelCase(subclassMatch ? slug.slice(subclassMatch[0].length) : slug);
    const className = subclassMatch ? `${module}${subclassMatch[1]}` : module;
    if (subclassMatch) {
      sourceUrl = `${URL}/src/modules/${module}/${subclassMatch[1]}.ts`;
    }
    const lineNumber = getMethodLineNumber(module, methodName, className);

    if (lineNumber) {
      sourceUrl += `#lines-${lineNumber}`;
    }
  }

  const links = ([
    ["Source", sourceUrl],
    ["Playground", playgroundUrl],
    ["Docs", docsUrl],
    ["Tests", testsUrl]
  ]).filter(i => i)
    .map(i => `[${i![0]}](${i![1]})`)
    .join(" • ");

  const sourceSection = `\n## Source\n\n${links}\n`;
  return src + sourceSection;
};
