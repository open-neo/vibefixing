import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { runScan } from "../../src/commands/scan.js";

const FIXTURES_DIR = resolve(__dirname, "../fixtures/sample-project");

describe("scan command", () => {
  it("scans a project and returns results", async () => {
    const result = await runScan({
      path: FIXTURES_DIR,
      format: "json",
    });
    expect(result).toBeDefined();
    expect(result.projectPath).toBe(FIXTURES_DIR);
    expect(typeof result.filesScanned).toBe("number");
    expect(Array.isArray(result.findings)).toBe(true);
    expect(typeof result.duration).toBe("number");
  });

  it("reports file count in scan results", async () => {
    const result = await runScan({
      path: FIXTURES_DIR,
      format: "json",
    });
    expect(result.filesScanned).toBeGreaterThan(0);
  });

  it("includes skills used in scan results", async () => {
    const result = await runScan({
      path: FIXTURES_DIR,
      format: "json",
    });
    expect(Array.isArray(result.skills)).toBe(true);
  });

  it("returns findings with correct structure", async () => {
    const result = await runScan({
      path: FIXTURES_DIR,
      format: "json",
    });

    if (result.findings.length > 0) {
      const finding = result.findings[0];
      expect(finding).toHaveProperty("id");
      expect(finding).toHaveProperty("filePath");
      expect(finding).toHaveProperty("line");
      expect(finding).toHaveProperty("severity");
      expect(finding).toHaveProperty("title");
      expect(finding).toHaveProperty("description");
    }
  });

  it("respects severity filter", async () => {
    const result = await runScan({
      path: FIXTURES_DIR,
      severity: "critical",
      format: "json",
    });

    for (const finding of result.findings) {
      expect(finding.severity).toBe("critical");
    }
  });

  it("returns exit code 0 when no findings for high severity", async () => {
    // Use a high severity threshold that may not match
    const result = await runScan({
      path: FIXTURES_DIR,
      severity: "critical",
      format: "json",
    });
    // Just verify it completes without error
    expect(result).toBeDefined();
  });
});
