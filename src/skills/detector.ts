import { resolve } from "node:path";
import { fileExists, readFileContent } from "../utils/file.js";

export interface DetectionResult {
  languages: string[];
  frameworks: string[];
  packageManager: string;
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const FRAMEWORK_DETECTORS: Array<{
  name: string;
  packages: string[];
}> = [
  { name: "nextjs", packages: ["next"] },
  { name: "react", packages: ["react"] },
  { name: "nestjs", packages: ["@nestjs/core"] },
  { name: "express", packages: ["express"] },
  { name: "fastify", packages: ["fastify"] },
  { name: "django", packages: ["django"] },
  { name: "flask", packages: ["flask"] },
  { name: "spring", packages: ["spring-boot-starter"] },
];

const LANGUAGE_FILE_PATTERNS: Record<string, string[]> = {
  typescript: ["tsconfig.json", "*.ts", "*.tsx"],
  python: ["requirements.txt", "pyproject.toml", "setup.py", "*.py"],
  java: ["pom.xml", "build.gradle", "*.java"],
  go: ["go.mod", "*.go"],
  rust: ["Cargo.toml", "*.rs"],
  ruby: ["Gemfile", "*.rb"],
};

export async function detectProjectStack(
  rootPath: string
): Promise<DetectionResult> {
  const languages = await detectLanguages(rootPath);
  const frameworks = await detectFrameworks(rootPath);
  const packageManager = await detectPM(rootPath);

  return { languages, frameworks, packageManager };
}

async function detectLanguages(rootPath: string): Promise<string[]> {
  const detected: string[] = [];

  for (const [language, patterns] of Object.entries(LANGUAGE_FILE_PATTERNS)) {
    for (const pattern of patterns) {
      if (!pattern.includes("*")) {
        if (await fileExists(resolve(rootPath, pattern))) {
          detected.push(language);
          break;
        }
      }
    }
  }

  return detected;
}

async function detectFrameworks(rootPath: string): Promise<string[]> {
  const detected: string[] = [];

  const pkgPath = resolve(rootPath, "package.json");
  if (await fileExists(pkgPath)) {
    try {
      const content = await readFileContent(pkgPath);
      const pkg: PackageJson = JSON.parse(content);
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      for (const detector of FRAMEWORK_DETECTORS) {
        if (detector.packages.some((p) => p in allDeps)) {
          detected.push(detector.name);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Check Python frameworks
  const requirementsPath = resolve(rootPath, "requirements.txt");
  if (await fileExists(requirementsPath)) {
    try {
      const content = await readFileContent(requirementsPath);
      for (const detector of FRAMEWORK_DETECTORS) {
        if (detector.packages.some((p) => content.includes(p))) {
          detected.push(detector.name);
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  return detected;
}

async function detectPM(rootPath: string): Promise<string> {
  const checks: Array<{ file: string; pm: string }> = [
    { file: "pnpm-lock.yaml", pm: "pnpm" },
    { file: "yarn.lock", pm: "yarn" },
    { file: "bun.lockb", pm: "bun" },
    { file: "package-lock.json", pm: "npm" },
  ];

  for (const { file, pm } of checks) {
    if (await fileExists(resolve(rootPath, file))) {
      return pm;
    }
  }

  return "unknown";
}
