import fg from "fast-glob";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { DEFAULT_IGNORE_PATTERNS } from "../config/config.js";

export async function discoverFiles(
  rootPath: string,
  patterns: string[] = ["**/*"],
  ignore: string[] = DEFAULT_IGNORE_PATTERNS
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
): Promise<string> {
  const checks: Array<{ file: string; manager: string }> = [
    { file: "pnpm-lock.yaml", manager: "pnpm" },
    { file: "yarn.lock", manager: "yarn" },
    { file: "bun.lockb", manager: "bun" },
    { file: "package-lock.json", manager: "npm" },
    { file: "poetry.lock", manager: "poetry" },
    { file: "Pipfile.lock", manager: "pipenv" },
    { file: "Pipfile", manager: "pipenv" },
    { file: "conda-lock.yml", manager: "conda" },
    { file: "environment.yml", manager: "conda" },
    { file: "requirements.txt", manager: "pip" },
  ];

  for (const check of checks) {
    if (await fileExists(resolve(rootPath, check.file))) {
      return check.manager;
    }
  }

  return "unknown";
}
