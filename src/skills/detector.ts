import { resolve } from "node:path";
import fg from "fast-glob";
import { parse as parseTOML } from "smol-toml";
import { parse as parseYaml } from "yaml";
import { fileExists, readFileContent } from "../utils/file.js";

export interface DetectionResult {
  languages: string[];
  frameworks: string[];
  packageManagers: string[];
  infrastructure: string[];
  databases: string[];
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
  { name: "vue", packages: ["vue"] },
  { name: "angular", packages: ["@angular/core"] },
  { name: "nuxt", packages: ["nuxt"] },
  { name: "svelte", packages: ["svelte", "@sveltejs/kit"] },
  { name: "remix", packages: ["@remix-run/react"] },
  { name: "astro", packages: ["astro"] },
  { name: "supabase", packages: ["@supabase/supabase-js"] },
  { name: "firebase", packages: ["firebase", "firebase-admin"] },
  { name: "rails", packages: ["rails"] },
  { name: "laravel", packages: ["laravel/framework"] },
  { name: "flutter", packages: ["flutter"] },
];

const LANGUAGE_FILE_PATTERNS: Record<string, string[]> = {
  typescript: ["tsconfig.json", "*.ts", "*.tsx"],
  javascript: ["package.json", "*.js", "*.jsx"],
  python: ["requirements.txt", "pyproject.toml", "setup.py", "*.py"],
  java: ["pom.xml", "build.gradle", "*.java"],
  go: ["go.mod", "*.go"],
  rust: ["Cargo.toml", "*.rs"],
  ruby: ["Gemfile", "*.rb"],
  php: ["composer.json", "*.php"],
  csharp: ["*.csproj", "*.sln"],
  swift: ["Package.swift", "*.swift"],
  kotlin: ["*.kt", "build.gradle.kts"],
  scala: ["build.sbt", "*.scala"],
  dart: ["pubspec.yaml", "*.dart"],
  elixir: ["mix.exs", "*.ex"],
};

const DATABASE_DETECTORS: Array<{
  name: string;
  packages: string[];
}> = [
  { name: "postgresql", packages: ["pg", "pgx", "psycopg2", "asyncpg"] },
  { name: "mysql", packages: ["mysql2", "mysql", "mysqlclient", "pymysql"] },
  { name: "mongodb", packages: ["mongodb", "mongoose", "pymongo"] },
  { name: "redis", packages: ["redis", "ioredis", "aioredis"] },
  { name: "bigquery", packages: ["@google-cloud/bigquery", "google-cloud-bigquery"] },
  { name: "firestore", packages: ["@google-cloud/firestore"] },
];

const INFRASTRUCTURE_FILE_PATTERNS: Record<string, string[]> = {
  terraform: ["*.tf", "terraform.tfstate"],
  docker: ["Dockerfile", "docker-compose.yml", "docker-compose.yaml"],
  kubernetes: ["k8s/*.yml", "k8s/*.yaml"],
  "github-actions": [".github/workflows/*.yml"],
  aws: ["samconfig.toml", "cdk.json", "serverless.yml"],
  gcp: ["app.yaml", "cloudbuild.yaml"],
  azure: ["azure-pipelines.yml", "host.json"],
};

export async function detectProjectStack(
  rootPath: string
): Promise<DetectionResult> {
  const languages = await detectLanguages(rootPath);
  const frameworks = await detectFrameworks(rootPath);
  const packageManagers = await detectPMs(rootPath);
  const infrastructure = await detectInfrastructure(rootPath);
  const databases = await detectDatabases(rootPath);

  return { languages, frameworks, packageManagers, infrastructure, databases };
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

  // ── Ruby: Gemfile ──
  const gemfilePath = resolve(rootPath, "Gemfile");
  if (await fileExists(gemfilePath)) {
    try {
      const content = await readFileContent(gemfilePath);
      const packages = parseGemfile(content);
      matchFrameworksFromPackages(packages, detected);
    } catch {
      // Ignore read errors
    }
  }

  // ── PHP: composer.json ──
  const composerPath = resolve(rootPath, "composer.json");
  if (await fileExists(composerPath)) {
    try {
      const content = await readFileContent(composerPath);
      const packages = parseComposerJson(content);
      matchFrameworksFromPackages(packages, detected);
    } catch {
      // Ignore read errors
    }
  }

  // ── Dart: pubspec.yaml ──
  const pubspecPath = resolve(rootPath, "pubspec.yaml");
  if (await fileExists(pubspecPath)) {
    try {
      const content = await readFileContent(pubspecPath);
      const packages = parsePubspecYaml(content);
      matchFrameworksFromPackages(packages, detected);
    } catch {
      // Ignore read errors
    }
  }

  // ── Java: pom.xml (Spring detection) ──
  const pomPath = resolve(rootPath, "pom.xml");
  if (await fileExists(pomPath)) {
    try {
      const content = await readFileContent(pomPath);
      if (content.includes("spring-boot") || content.includes("spring-framework")) {
        if (!detected.includes("spring")) {
          detected.push("spring");
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  // ── Java: build.gradle (Spring detection) ──
  const gradlePath = resolve(rootPath, "build.gradle");
  if (await fileExists(gradlePath)) {
    try {
      const content = await readFileContent(gradlePath);
      if (content.includes("spring-boot") || content.includes("org.springframework")) {
        if (!detected.includes("spring")) {
          detected.push("spring");
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  // ── C#: .csproj (ASP.NET detection) ──
  const csprojFiles = await fg("*.csproj", { cwd: rootPath, absolute: true });
  for (const csprojFile of csprojFiles) {
    try {
      const content = await readFileContent(csprojFile);
      if (content.includes("Microsoft.AspNetCore") || content.includes("Microsoft.NET.Sdk.Web")) {
        if (!detected.includes("aspnet")) {
          detected.push("aspnet");
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  return detected;
}

// ── Gemfile parser (Ruby) ────────────────────────────────────────────────
function parseGemfile(content: string): Set<string> {
  const gems = new Set<string>();
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^\s*gem\s+['"]([^'"]+)['"]/);
    if (match) {
      gems.add(match[1]);
    }
  }
  return gems;
}

// ── composer.json parser (PHP) ──────────────────────────────────────────
function parseComposerJson(content: string): Set<string> {
  const packages = new Set<string>();
  try {
    const data = JSON.parse(content) as {
      require?: Record<string, string>;
      "require-dev"?: Record<string, string>;
    };
    const allDeps = { ...data.require, ...data["require-dev"] };
    for (const name of Object.keys(allDeps)) {
      packages.add(name);
    }
  } catch {
    // Ignore parse errors
  }
  return packages;
}

// ── pubspec.yaml parser (Dart/Flutter) ──────────────────────────────────
function parsePubspecYaml(content: string): Set<string> {
  const packages = new Set<string>();
  try {
    const data = parseYaml(content) as {
      dependencies?: Record<string, unknown>;
      dev_dependencies?: Record<string, unknown>;
    };
    if (data.dependencies) {
      for (const name of Object.keys(data.dependencies)) {
        packages.add(name);
      }
    }
    if (data.dev_dependencies) {
      for (const name of Object.keys(data.dev_dependencies)) {
        packages.add(name);
      }
    }
  } catch {
    // Ignore parse errors
  }
  return packages;
}

// ── Infrastructure detection (file-based) ───────────────────────────────
async function detectInfrastructure(rootPath: string): Promise<string[]> {
  const detected: string[] = [];

  for (const [infra, patterns] of Object.entries(INFRASTRUCTURE_FILE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.includes("*")) {
        // Use glob for wildcard patterns
        const matches = await fg(pattern, {
          cwd: rootPath,
          onlyFiles: true,
          dot: true,
        });
        if (matches.length > 0) {
          detected.push(infra);
          break;
        }
      } else {
        if (await fileExists(resolve(rootPath, pattern))) {
          detected.push(infra);
          break;
        }
      }
    }
  }

  return detected;
}

// ── Database detection (package-based) ──────────────────────────────────
async function detectDatabases(rootPath: string): Promise<string[]> {
  const detected: string[] = [];
  const allPackages = await collectAllPackages(rootPath);

  for (const detector of DATABASE_DETECTORS) {
    if (detector.packages.some((p) => allPackages.has(p) || allPackages.has(normalizePythonPackageName(p)))) {
      detected.push(detector.name);
    }
  }

  return detected;
}

// ── Collect all packages from all supported manifest files ──────────────
async function collectAllPackages(rootPath: string): Promise<Set<string>> {
  const allPackages = new Set<string>();

  // Node.js: package.json
  const pkgPath = resolve(rootPath, "package.json");
  if (await fileExists(pkgPath)) {
    try {
      const content = await readFileContent(pkgPath);
      const pkg: PackageJson = JSON.parse(content);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const name of Object.keys(deps)) {
        allPackages.add(name);
      }
    } catch { /* ignore */ }
  }

  // Python: requirements.txt
  const reqPath = resolve(rootPath, "requirements.txt");
  if (await fileExists(reqPath)) {
    try {
      const content = await readFileContent(reqPath);
      for (const p of parseRequirementsTxt(content)) allPackages.add(p);
    } catch { /* ignore */ }
  }

  // Python: pyproject.toml
  const pyprojectPath = resolve(rootPath, "pyproject.toml");
  if (await fileExists(pyprojectPath)) {
    try {
      const content = await readFileContent(pyprojectPath);
      for (const p of parsePyprojectToml(content)) allPackages.add(p);
    } catch { /* ignore */ }
  }

  // Ruby: Gemfile
  const gemfilePath = resolve(rootPath, "Gemfile");
  if (await fileExists(gemfilePath)) {
    try {
      const content = await readFileContent(gemfilePath);
      for (const p of parseGemfile(content)) allPackages.add(p);
    } catch { /* ignore */ }
  }

  // PHP: composer.json
  const composerPath = resolve(rootPath, "composer.json");
  if (await fileExists(composerPath)) {
    try {
      const content = await readFileContent(composerPath);
      for (const p of parseComposerJson(content)) allPackages.add(p);
    } catch { /* ignore */ }
  }

  // Dart: pubspec.yaml
  const pubspecPath = resolve(rootPath, "pubspec.yaml");
  if (await fileExists(pubspecPath)) {
    try {
      const content = await readFileContent(pubspecPath);
      for (const p of parsePubspecYaml(content)) allPackages.add(p);
    } catch { /* ignore */ }
  }

  return allPackages;
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
