import fg from "fast-glob";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

export async function discoverFiles(
  rootPath: string,
  patterns: string[] = ["**/*"],
  ignore: string[] = ["node_modules", ".git", "dist", "build", ".next"]
): Promise<string[]> {
  const absoluteRoot = resolve(rootPath);
  const files = await fg(patterns, {
    cwd: absoluteRoot,
    ignore,
    absolute: true,
    onlyFiles: true,
    dot: false,
  });
  return files.sort();
}

export async function readFileContent(filePath: string): Promise<string> {
  return readFile(filePath, "utf-8");
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function detectPackageManager(
  rootPath: string
): Promise<"npm" | "yarn" | "pnpm" | "bun" | "unknown"> {
  const checks: Array<{ file: string; manager: "pnpm" | "yarn" | "bun" | "npm" }> = [
    { file: "pnpm-lock.yaml", manager: "pnpm" },
    { file: "yarn.lock", manager: "yarn" },
    { file: "bun.lockb", manager: "bun" },
    { file: "package-lock.json", manager: "npm" },
  ];

  for (const check of checks) {
    if (await fileExists(resolve(rootPath, check.file))) {
      return check.manager;
    }
  }

  return "unknown";
}
