import { resolve } from "node:path";
import { parse as parseTOML } from "smol-toml";
import { fileExists, readFileContent } from "../utils/file.js";

export interface DetectionResult {
  languages: string[];
  frameworks: string[];
  packageManagers: string[];
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
  { name: "fastapi", packages: ["fastapi"] },
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
  const packageManagers = await detectPMs(rootPath);

  return { languages, frameworks, packageManagers };
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

// ── PEP 503 normalisation ───────────────────────────────────────────────
function normalizePythonPackageName(name: string): string {
  return name.toLowerCase().replace(/[-_.]+/g, "-");
}

// ── requirements.txt parser ─────────────────────────────────────────────
function parseRequirementsTxt(content: string): Set<string> {
  const packages = new Set<string>();

  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    // Skip pip flags like -r, -e, --index-url, etc.
    if (line.startsWith("-")) continue;

    // Remove environment markers (everything after ';')
    const withoutMarker = line.split(";")[0].trim();
    // Remove version specifiers
    const nameOnly = withoutMarker.split(/[>=<!~]/)[0].trim();
    // Remove extras like [security]
    const withoutExtras = nameOnly.replace(/\[.*?\]/, "");

    if (withoutExtras) {
      packages.add(normalizePythonPackageName(withoutExtras));
    }
  }

  return packages;
}

// ── pyproject.toml parser ───────────────────────────────────────────────
function parsePyprojectToml(content: string): Set<string> {
  const packages = new Set<string>();

  try {
    const doc = parseTOML(content) as Record<string, unknown>;

    // PEP 621: [project.dependencies]
    const project = doc.project as Record<string, unknown> | undefined;
    if (project) {
      const deps = project.dependencies;
      if (Array.isArray(deps)) {
        for (const dep of deps) {
          addPythonDep(packages, String(dep));
        }
      }

      // PEP 621: [project.optional-dependencies]
      const optDeps = project["optional-dependencies"] as
        | Record<string, unknown>
        | undefined;
      if (optDeps && typeof optDeps === "object") {
        for (const group of Object.values(optDeps)) {
          if (Array.isArray(group)) {
            for (const dep of group) {
              addPythonDep(packages, String(dep));
            }
          }
        }
      }
    }

    // Poetry: [tool.poetry.dependencies]
    const tool = doc.tool as Record<string, unknown> | undefined;
    const poetry = tool?.poetry as Record<string, unknown> | undefined;
    if (poetry) {
      const poetryDeps = poetry.dependencies as
        | Record<string, unknown>
        | undefined;
      if (poetryDeps && typeof poetryDeps === "object") {
        for (const name of Object.keys(poetryDeps)) {
          if (name === "python") continue;
          packages.add(normalizePythonPackageName(name));
        }
      }

      // Poetry groups: [tool.poetry.group.*.dependencies]
      const groups = poetry.group as Record<string, unknown> | undefined;
      if (groups && typeof groups === "object") {
        for (const group of Object.values(groups)) {
          const groupObj = group as Record<string, unknown> | undefined;
          const groupDeps = groupObj?.dependencies as
            | Record<string, unknown>
            | undefined;
          if (groupDeps && typeof groupDeps === "object") {
            for (const name of Object.keys(groupDeps)) {
              if (name === "python") continue;
              packages.add(normalizePythonPackageName(name));
            }
          }
        }
      }
    }
  } catch {
    // Ignore TOML parse errors
  }

  return packages;
}

// ── setup.cfg parser ────────────────────────────────────────────────────
function parseSetupCfg(content: string): Set<string> {
  const packages = new Set<string>();

  // Find [options] section and extract install_requires
  const lines = content.split("\n");
  let inOptions = false;
  let inInstallRequires = false;

  for (const raw of lines) {
    const line = raw.trim();

    // Section headers
    if (line.startsWith("[")) {
      inOptions = line === "[options]";
      inInstallRequires = false;
      continue;
    }

    if (!inOptions) continue;

    // Start of install_requires
    if (line.startsWith("install_requires")) {
      inInstallRequires = true;
      // Value may start on this line after '='
      const afterEquals = line.split("=").slice(1).join("=").trim();
      if (afterEquals) {
        addPythonDep(packages, afterEquals);
      }
      continue;
    }

    // Continuation lines (indented) of install_requires
    if (inInstallRequires) {
      if (raw.startsWith(" ") || raw.startsWith("\t")) {
        if (line && !line.startsWith("#")) {
          addPythonDep(packages, line);
        }
      } else {
        // Non-indented line means end of multi-line value
        inInstallRequires = false;
      }
    }
  }

  return packages;
}

// ── setup.py parser (best-effort) ───────────────────────────────────────
function parseSetupPy(content: string): Set<string> {
  const packages = new Set<string>();

  // Match install_requires=[...] list literal
  const match = content.match(
    /install_requires\s*=\s*\[([\s\S]*?)\]/
  );
  if (match) {
    // Extract quoted strings from the list
    const listContent = match[1];
    const strings = listContent.match(/['"]([^'"]+)['"]/g);
    if (strings) {
      for (const s of strings) {
        const dep = s.slice(1, -1); // Remove quotes
        addPythonDep(packages, dep);
      }
    }
  }

  return packages;
}

// ── Helper: extract normalised package name from a PEP 508 dep string ──
function addPythonDep(packages: Set<string>, depString: string): void {
  const trimmed = depString.trim();
  if (!trimmed || trimmed.startsWith("#")) return;

  const withoutMarker = trimmed.split(";")[0].trim();
  const nameOnly = withoutMarker.split(/[>=<!~]/)[0].trim();
  const withoutExtras = nameOnly.replace(/\[.*?\]/, "");

  if (withoutExtras) {
    packages.add(normalizePythonPackageName(withoutExtras));
  }
}

// ── Match frameworks from a set of normalised package names ─────────────
function matchFrameworksFromPackages(
  packages: Set<string>,
  detected: string[]
): void {
  for (const detector of FRAMEWORK_DETECTORS) {
    if (
      detector.packages.some((p) =>
        packages.has(normalizePythonPackageName(p))
      )
    ) {
      if (!detected.includes(detector.name)) {
        detected.push(detector.name);
      }
    }
  }
}

// ── Framework detection ─────────────────────────────────────────────────
async function detectFrameworks(rootPath: string): Promise<string[]> {
  const detected: string[] = [];

  // ── Node.js / package.json ──
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

  // ── Python: requirements.txt ──
  const requirementsPath = resolve(rootPath, "requirements.txt");
  if (await fileExists(requirementsPath)) {
    try {
      const content = await readFileContent(requirementsPath);
      const packages = parseRequirementsTxt(content);
      matchFrameworksFromPackages(packages, detected);
    } catch {
      // Ignore read errors
    }
  }

  // ── Python: pyproject.toml ──
  const pyprojectPath = resolve(rootPath, "pyproject.toml");
  if (await fileExists(pyprojectPath)) {
    try {
      const content = await readFileContent(pyprojectPath);
      const packages = parsePyprojectToml(content);
      matchFrameworksFromPackages(packages, detected);
    } catch {
      // Ignore read errors
    }
  }

  // ── Python: setup.cfg ──
  const setupCfgPath = resolve(rootPath, "setup.cfg");
  if (await fileExists(setupCfgPath)) {
    try {
      const content = await readFileContent(setupCfgPath);
      const packages = parseSetupCfg(content);
      matchFrameworksFromPackages(packages, detected);
    } catch {
      // Ignore read errors
    }
  }

  // ── Python: setup.py ──
  const setupPyPath = resolve(rootPath, "setup.py");
  if (await fileExists(setupPyPath)) {
    try {
      const content = await readFileContent(setupPyPath);
      const packages = parseSetupPy(content);
      matchFrameworksFromPackages(packages, detected);
    } catch {
      // Ignore read errors
    }
  }

  return detected;
}

// ── Package manager detection ───────────────────────────────────────────
async function detectPMs(rootPath: string): Promise<string[]> {
  const detected: string[] = [];

  const checks: Array<{ file: string; pm: string }> = [
    // Node.js PMs
    { file: "pnpm-lock.yaml", pm: "pnpm" },
    { file: "yarn.lock", pm: "yarn" },
    { file: "bun.lockb", pm: "bun" },
    { file: "package-lock.json", pm: "npm" },
    // Python PMs
    { file: "poetry.lock", pm: "poetry" },
    { file: "Pipfile.lock", pm: "pipenv" },
    { file: "Pipfile", pm: "pipenv" },
    { file: "conda-lock.yml", pm: "conda" },
    { file: "environment.yml", pm: "conda" },
    { file: "requirements.txt", pm: "pip" },
  ];

  for (const { file, pm } of checks) {
    if (await fileExists(resolve(rootPath, file))) {
      if (!detected.includes(pm)) {
        detected.push(pm);
      }
    }
  }

  if (detected.length === 0) {
    detected.push("unknown");
  }

  return detected;
}
