import { resolve } from "node:path";
import { scanProject } from "../engine/scanner.js";
import { resolveSkills } from "../engine/skill-resolver.js";
import { SkillRegistry } from "../skills/registry.js";
import { loadConfig } from "../config/config.js";
import { logger } from "../utils/logger.js";
import { formatJson, formatScanReport } from "../utils/output.js";
import type { OutputFormat, Severity, ScanResult } from "../types/index.js";

export interface ScanOptions {
  path: string;
  skills?: string;
  severity?: Severity;
  format?: OutputFormat;
  output?: string;
  ignore?: string;
  noAi?: boolean;
}

export async function runScan(options: ScanOptions): Promise<ScanResult> {
  const rootPath = resolve(options.path);
  const { config } = await loadConfig(rootPath);

  const severity = options.severity ?? config.scan.severity;
  const format = options.format ?? config.output.format;
  const ignore = options.ignore
    ? options.ignore.split(",")
    : config.scan.ignore;

  // Load skills
  const registry = new SkillRegistry();
  await registry.loadBuiltinSkills();

  const enabledSkillIds = options.skills
    ? options.skills.split(",")
    : config.skills.enabled;

  // Resolve skills for this project
  const resolution = await resolveSkills(rootPath, registry, enabledSkillIds);

  // Get actual skill objects
  const skills = resolution.resolvedSkills
    .map((id) => registry.getById(id))
    .filter((s) => s !== undefined);

  const startTime = Date.now();

  // Run scan
  const { findings, filesScanned } = await scanProject({
    rootPath,
    skills,
    severity,
    ignore,
    maxFiles: config.scan.maxFiles,
  });

  const duration = Date.now() - startTime;

  const result: ScanResult = {
    projectPath: rootPath,
    filesScanned,
    skills: skills.map((s) => s.skillId),
    findings,
    duration,
  };

  // Format output
  switch (format) {
    case "json":
      logger.info(formatJson(result));
      break;
    case "sarif":
      logger.info(formatJson(toSarif(result)));
      break;
    case "table":
    default:
      logger.info(formatScanReport(result));
      break;
  }

  return result;
}

function toSarif(result: ScanResult): object {
  return {
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/sarif-2.1/schema/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "vibefixing",
            version: "0.1.1",
            informationUri: "https://github.com/vibeplatform/vibefixing",
          },
        },
        results: result.findings.map((f) => ({
          ruleId: f.ruleId ?? f.skillId ?? "unknown",
          level: sarifLevel(f.severity),
          message: { text: f.description },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: f.filePath },
                region: {
                  startLine: f.line,
                  startColumn: f.column ?? 1,
                },
              },
            },
          ],
        })),
      },
    ],
  };
}

function sarifLevel(severity: Severity): string {
  switch (severity) {
    case "critical":
    case "high":
      return "error";
    case "medium":
      return "warning";
    case "low":
    case "info":
      return "note";
  }
}
