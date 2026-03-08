import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { scanProject } from "../../src/engine/scanner.js";
import type { Skill } from "../../src/types/index.js";

const FIXTURES_DIR = resolve(__dirname, "../fixtures/sample-project");

const testSkill: Skill = {
  skillId: "test-scanner-skill",
  category: "security",
  name: "Test Scanner Skill",
  version: "1.0.0",
  match: { files: ["*.ts"] },
  rules: ["No hardcoded secrets"],
  antiPatterns: [
    "Hardcoded API keys in source code",
    "Hardcoded passwords in source code",
  ],
  severity: {
    "Hardcoded API keys in source code": "critical",
    "Hardcoded passwords in source code": "critical",
  },
};

describe("scanner", () => {
  it("scans files and returns results", async () => {
    const result = await scanProject({
      rootPath: FIXTURES_DIR,
      skills: [testSkill],
      severity: "low",
      ignore: ["node_modules"],
    });

    expect(result.filesScanned).toBeGreaterThan(0);
    expect(Array.isArray(result.findings)).toBe(true);
  });

  it("findings have correct structure", async () => {
    const result = await scanProject({
      rootPath: FIXTURES_DIR,
      skills: [testSkill],
      severity: "low",
      ignore: ["node_modules"],
    });

    for (const finding of result.findings) {
      expect(finding.id).toBeDefined();
      expect(finding.filePath).toBeDefined();
      expect(typeof finding.line).toBe("number");
      expect(finding.severity).toBeDefined();
      expect(finding.title).toBeDefined();
    }
  });

  it("sorts findings by severity (critical first)", async () => {
    const result = await scanProject({
      rootPath: FIXTURES_DIR,
      skills: [testSkill],
      severity: "low",
      ignore: ["node_modules"],
    });

    if (result.findings.length > 1) {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
      for (let i = 0; i < result.findings.length - 1; i++) {
        expect(
          severityOrder[result.findings[i].severity]
        ).toBeGreaterThanOrEqual(
          severityOrder[result.findings[i + 1].severity]
        );
      }
    }
  });

  it("respects severity filter", async () => {
    const result = await scanProject({
      rootPath: FIXTURES_DIR,
      skills: [testSkill],
      severity: "critical",
      ignore: ["node_modules"],
    });

    for (const finding of result.findings) {
      expect(finding.severity).toBe("critical");
    }
  });

  it("respects maxFiles option", async () => {
    const result = await scanProject({
      rootPath: FIXTURES_DIR,
      skills: [testSkill],
      severity: "low",
      ignore: ["node_modules"],
      maxFiles: 1,
    });

    expect(result.filesScanned).toBeLessThanOrEqual(1);
  });

  it("returns zero findings for empty skills", async () => {
    const result = await scanProject({
      rootPath: FIXTURES_DIR,
      skills: [],
      severity: "low",
      ignore: ["node_modules"],
    });

    expect(result.findings.length).toBe(0);
  });
});
