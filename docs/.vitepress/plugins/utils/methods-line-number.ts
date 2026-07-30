import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { pascalCase } from "scule";
import { type Node, ScriptTarget, SyntaxKind, createSourceFile, forEachChild, isClassDeclaration, isMethodDeclaration } from "typescript";

const methodLineCache = new Map<string, Map<string, number>>();
const moduleSubclassCache = new Map<string, string[]>();

const normalize = (value: string) => value.replace(/[^a-z0-9]/gi, "").toLowerCase();

const resolveSubclassSlug = (moduleName: string, className?: string): string | null => {
  if (!className) return null;

  const moduleKey = normalize(moduleName);
  const classKey = normalize(className);

  if (classKey === moduleKey || classKey === normalize(pascalCase(moduleName))) {
    return null;
  }

  const subclasses = getModuleSubclassSlugs(moduleName);
  for (const subclass of subclasses) {
    const subclassKey = normalize(subclass);
    const candidates = [
      subclassKey,
      normalize(`${moduleName}${subclass}`),
      normalize(`${moduleName}-${subclass}`),
      normalize(`${pascalCase(moduleName)}${pascalCase(subclass)}`)
    ];

    if (candidates.includes(classKey)) {
      return subclass;
    }
  }

  return null;
};

export const getModuleSubclassSlugs = (moduleName: string): string[] => {
  if (moduleSubclassCache.has(moduleName)) {
    return moduleSubclassCache.get(moduleName)!;
  }

  try {
    const projectDir = process.cwd();
    const moduleDirPath = path.join(projectDir, `src/modules/${moduleName}`);
    const slugs = readdirSync(moduleDirPath, { withFileTypes: true })
      .filter(entry => entry.isFile())
      .map(entry => entry.name)
      .filter(name => name.endsWith(".ts") && name !== "index.ts")
      .map(name => name.slice(0, -3));

    moduleSubclassCache.set(moduleName, slugs);
    return slugs;
  }
  catch {
    moduleSubclassCache.set(moduleName, []);
    return [];
  }
};

export const getMethodLineNumber = (moduleName: string, methodName: string, className?: string) => {
  const subclassSlug = resolveSubclassSlug(moduleName, className);
  const targetClass = subclassSlug ? pascalCase(`${moduleName}-${subclassSlug}`) : pascalCase(moduleName);
  const cacheKey = `${moduleName}:${targetClass}`;

  if (methodLineCache.has(cacheKey)) {
    return methodLineCache.get(cacheKey)!.get(methodName) ?? null;
  }

  try {
    const projectDir = process.cwd();
    const sourceFilePath = subclassSlug ? path.join(projectDir, `src/modules/${moduleName}/${subclassSlug}.ts`) : path.join(projectDir, `src/modules/${moduleName}/index.ts`);
    const code = readFileSync(sourceFilePath, "utf8");
    const sourceFile = createSourceFile(sourceFilePath, code, ScriptTarget.Latest, true);

    const methodLines = new Map<string, number>();

    const visit = (node: Node) => {
      if (isClassDeclaration(node) && node.name) {
        if (normalize(node.name.text) !== normalize(targetClass)) {
          forEachChild(node, visit);
          return;
        }
        for (const member of node.members) {
          if (isMethodDeclaration(member)) {
            const isPrivate = member.modifiers?.some(modifier => modifier.kind === SyntaxKind.PrivateKeyword);
            if (isPrivate) continue;

            const name = member.name?.getText(sourceFile);
            if (name) {
              const lineNumber = sourceFile.getLineAndCharacterOfPosition(member.getStart(sourceFile)).line + 1;
              methodLines.set(name, lineNumber);
            }
          }
        }
      }
      forEachChild(node, visit);
    };

    visit(sourceFile);
    methodLineCache.set(cacheKey, methodLines);
    return methodLines.get(methodName) ?? null;
  }
  catch (error) {
    console.error(`Error reading ${moduleName} line numbers for ${methodName}:`, error);
    return null;
  }
};
