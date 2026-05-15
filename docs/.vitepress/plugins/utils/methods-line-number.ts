import { readFileSync } from "node:fs";
import path from "node:path";
import { pascalCase } from "scule";
import { type Node, ScriptTarget, SyntaxKind, createSourceFile, forEachChild, isClassDeclaration, isMethodDeclaration } from "typescript";

const methodLineCache = new Map<string, Map<string, number>>();
const moduleSubclassCache = new Map<string, string[]>();

export const getModuleSubclassSlugs = (moduleName: string): string[] => {
  if (moduleSubclassCache.has(moduleName)) {
    return moduleSubclassCache.get(moduleName)!;
  }

  try {
    const projectDir = process.cwd();
    const sourceFilePath = path.join(projectDir, `src/modules/${moduleName}.ts`);
    const code = readFileSync(sourceFilePath, "utf8");
    const sourceFile = createSourceFile(sourceFilePath, code, ScriptTarget.Latest, true);

    const classNames: string[] = [];
    const visit = (node: Node) => {
      if (isClassDeclaration(node) && node.name) {
        classNames.push(node.name.text);
      }
      forEachChild(node, visit);
    };
    visit(sourceFile);

    const mainClass = classNames.find(name => name === pascalCase(moduleName)) ?? "";
    const slugs = classNames
      .filter(name => name !== mainClass && name.toLowerCase().startsWith(mainClass.toLowerCase()))
      .map(name => name.slice(mainClass.length).toLowerCase());

    moduleSubclassCache.set(moduleName, slugs);
    return slugs;
  }
  catch {
    moduleSubclassCache.set(moduleName, []);
    return [];
  }
};

export const getMethodLineNumber = (moduleName: string, methodName: string, className?: string) => {
  const targetClass = className ?? moduleName;
  const cacheKey = `${moduleName}:${targetClass}`;

  if (methodLineCache.has(cacheKey)) {
    return methodLineCache.get(cacheKey)!.get(methodName) ?? null;
  }

  try {
    const projectDir = process.cwd();
    const sourceFilePath = path.join(projectDir, `src/modules/${moduleName}.ts`);
    const code = readFileSync(sourceFilePath, "utf8");
    const sourceFile = createSourceFile(sourceFilePath, code, ScriptTarget.Latest, true);

    const methodLines = new Map<string, number>();

    const visit = (node: Node) => {
      if (isClassDeclaration(node) && node.name) {
        if (node.name.text.toLowerCase() !== targetClass.toLowerCase()) {
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
