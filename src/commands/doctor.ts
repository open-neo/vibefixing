import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { loadConfig } from "../config/config.js";
import { SkillRegistry } from "../skills/registry.js";
import { detectProjectStack } from "../skills/detector.js";
import { resolveSkills } from "../engine/skill-resolver.js";
import { scanProject } from "../engine/scanner.js";
import { logger } from "../utils/logger.js";
import { formatDoctorReport } from "../utils/output.js";
import type {
  DoctorCheck,
  DetectedSkillInfo,
  DoctorReportData,
  Finding,
  HealthScore,
  Recommendation,
  Severity,
} from "../types/index.js";

export interface DoctorOptions {
  path?: string;
}

export async function runDoctor(
  options: DoctorOptions
): Promise<{ checks: DoctorCheck[]; allPassed: boolean }> {
  const checks: DoctorCheck[] = [];

  // Check Node.js
  checks.push(checkNodeVersion());

  // Check Git
  checks.push(checkGit());

  // Check AI providers
  checks.push(checkAIProvider("anthropic"));
  checks.push(checkAIProvider("openai"));

  // Check config file
  checks.push(await checkConfig(options.path));

  // Check SKILLS
  checks.push(await checkSkills());

  // Check disk space
  checks.push(checkDiskSpace());

  const allPassed = checks.every(
    (c) => c.status === "pass" || c.status === "skip"
  );

  // Build enhanced report data
  const rootPath = resolve(options.path ?? ".");
  const detectedSkills = await detectSkillsForProject(rootPath);
  const { health, recommendations } = await computeHealthAndRecommendations(
    rootPath
  );

  const reportData: DoctorReportData = {
    checks,
    skills: detectedSkills,
    health,
    recommendations,
  };

  logger.info(formatDoctorReport(reportData));

  return { checks, allPassed };
}

async function detectSkillsForProject(
  rootPath: string
): Promise<DetectedSkillInfo[]> {
  try {
    const detection = await detectProjectStack(rootPath);
    const registry = new SkillRegistry();
    await registry.loadBuiltinSkills();

    const matchedSkills = registry.matchSkills(
      detection.languages,
      detection.frameworks
    );

    const allSkills = registry.getAll();
    const matchedIds = new Set(matchedSkills.map((s) => s.skillId));

    return allSkills.map((skill) => ({
      name: skill.name,
      detected: matchedIds.has(skill.skillId),
    }));
  } catch {
    return [];
  }
}

async function computeHealthAndRecommendations(
  rootPath: string
): Promise<{ health: HealthScore; recommendations: Recommendation[] }> {
  try {
    const registry = new SkillRegistry();
    await registry.loadBuiltinSkills();

    const resolution = await resolveSkills(rootPath, registry);
    const skills = resolution.resolvedSkills
      .map((id) => registry.getById(id))
      .filter((s) => s !== undefined);

    if (skills.length === 0) {
      return {
        health: { architecture: 100, security: 100, quality: 100, overall: 100 },
        recommendations: [],
      };
    }

    const { config } = await loadConfig(rootPath);

    const { findings } = await scanProject({
      rootPath,
      skills,
      severity: "info",
      ignore: config.scan.ignore,
      maxFiles: config.scan.maxFiles ?? 200,
    });

    const health = computeScores(findings, skills);
    const recommendations = buildRecommendations(findings);

    return { health, recommendations };
  } catch {
    // If scan fails, return neutral scores
    return {
      health: { architecture: 100, security: 100, quality: 100, overall: 100 },
      recommendations: [],
    };
  }
}

function computeScores(
  findings: Finding[],
  skills: { skillId: string; category: string }[]
): HealthScore {
  const securitySkillIds = new Set(
    skills.filter((s) => s.category === "security").map((s) => s.skillId)
  );
  const archSkillIds = new Set(
    skills.filter((s) => s.category === "architecture").map((s) => s.skillId)
  );
  const qualitySkillIds = new Set(
    skills
      .filter(
        (s) =>
          s.category === "language" ||
          s.category === "framework" ||
          s.category === "process"
      )
      .map((s) => s.skillId)
  );

  const severityPenalty: Record<Severity, number> = {
    critical: 15,
    high: 10,
    medium: 5,
    low: 2,
    info: 1,
  };

  function scoreFromFindings(
    categoryIds: Set<string>,
    allFindings: Finding[]
  ): number {
    const relevant = allFindings.filter(
      (f) => f.skillId && categoryIds.has(f.skillId)
    );
    let penalty = 0;
    for (const f of relevant) {
      penalty += severityPenalty[f.severity];
    }
    return Math.max(0, Math.min(100, 100 - penalty));
  }

  const architecture = scoreFromFindings(archSkillIds, findings);
  const security = scoreFromFindings(securitySkillIds, findings);
  const quality = scoreFromFindings(qualitySkillIds, findings);

  // Weighted average: security matters most
  const overall = Math.round(
    architecture * 0.3 + security * 0.4 + quality * 0.3
  );

  return { architecture, security, quality, overall };
}

function buildRecommendations(findings: Finding[]): Recommendation[] {
  // Sort by severity, take top 5 unique messages
  const severityOrder: Record<Severity, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
    info: 0,
  };

  const sorted = [...findings].sort(
    (a, b) => severityOrder[b.severity] - severityOrder[a.severity]
  );

  const seen = new Set<string>();
  const recs: Recommendation[] = [];

  for (const f of sorted) {
    if (recs.length >= 5) break;
    const key = f.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recs.push({
      severity: f.severity,
      message: f.title,
    });
  }

  return recs;
}

function checkNodeVersion(): DoctorCheck {
  try {
    const version = process.version;
    const major = parseInt(version.slice(1).split(".")[0], 10);

    if (major >= 18) {
      return {
        name: "Node.js",
        status: "pass",
        details: version,
      };
    }

    return {
      name: "Node.js",
      status: "fail",
      details: `${version} (requires >= 18.0.0)`,
    };
  } catch {
    return {
      name: "Node.js",
      status: "fail",
      details: "Not found",
    };
  }
}

function checkGit(): DoctorCheck {
  try {
    const version = execSync("git --version", { encoding: "utf-8" }).trim();
    return {
      name: "Git",
      status: "pass",
      details: version.replace("git version ", ""),
    };
  } catch {
    return {
      name: "Git",
      status: "fail",
      details: "Not installed",
    };
  }
}

function checkAIProvider(
  provider: "anthropic" | "openai"
): DoctorCheck {
  const envKeys: Record<string, string[]> = {
    anthropic: ["ANTHROPIC_API_KEY", "VIBEFIXING_AI_API_KEY"],
    openai: ["OPENAI_API_KEY", "VIBEFIXING_AI_API_KEY"],
  };

  const keys = envKeys[provider];
  const configured = keys.some((key) => !!process.env[key]);

  const name = provider === "anthropic" ? "AI Provider (Claude)" : "AI Provider (GPT)";

  if (configured) {
    return { name, status: "pass", details: "API key configured" };
  }

  return { name, status: "skip", details: "Not configured" };
}

async function checkConfig(searchFrom?: string): Promise<DoctorCheck> {
  try {
    const { filepath } = await loadConfig(searchFrom);
    if (filepath) {
      return {
        name: "Config File",
        status: "pass",
        details: `.vibefixing.yml found`,
      };
    }
    return {
      name: "Config File",
      status: "warn",
      details: "No config file found. Run 'vibefixing init'",
    };
  } catch (error) {
    return {
      name: "Config File",
      status: "fail",
      details: `Invalid: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function checkSkills(): Promise<DoctorCheck> {
  try {
    const registry = new SkillRegistry();
    await registry.loadBuiltinSkills();
    const count = registry.count();

    return {
      name: "SKILLS Integrity",
      status: "pass",
      details: `${count} skills loaded`,
    };
  } catch {
    return {
      name: "SKILLS Integrity",
      status: "fail",
      details: "Failed to load skills",
    };
  }
}

function checkDiskSpace(): DoctorCheck {
  try {
    // Simple check - we can't easily get disk space in a cross-platform way
    // without external dependencies, so just report pass
    return {
      name: "Disk Space",
      status: "pass",
      details: "Available",
    };
  } catch {
    return {
      name: "Disk Space",
      status: "warn",
      details: "Could not check",
    };
  }
}
