import { describe, it, expect } from "vitest";
import { skillSchema, configSchema } from "../../src/skills/schema.js";

describe("skillSchema", () => {
  it("validates a valid skill definition", () => {
    const validSkill = {
      skillId: "lang-typescript",
      category: "language",
      name: "TypeScript Best Practices",
      version: "1.0.0",
      language: "typescript",
      match: {
        files: ["*.ts", "*.tsx"],
        dependencies: ["typescript"],
      },
      rules: ["Use strict TypeScript config"],
      antiPatterns: ["Using 'as any' type assertions"],
    };

    const result = skillSchema.safeParse(validSkill);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skillId).toBe("lang-typescript");
      expect(result.data.category).toBe("language");
    }
  });

  it("rejects skill with invalid ID format", () => {
    const invalid = {
      skillId: "InvalidID",
      category: "language",
      name: "Test",
      version: "1.0.0",
      match: { files: ["*.ts"] },
      rules: ["rule1"],
    };

    const result = skillSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects skill with invalid semver version", () => {
    const invalid = {
      skillId: "test-skill",
      category: "language",
      name: "Test",
      version: "not-semver",
      match: { files: ["*.ts"] },
      rules: ["rule1"],
    };

    const result = skillSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects skill with empty rules array", () => {
    const invalid = {
      skillId: "test-skill",
      category: "language",
      name: "Test",
      version: "1.0.0",
      match: { files: ["*.ts"] },
      rules: [],
    };

    const result = skillSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects skill with empty files array in match", () => {
    const invalid = {
      skillId: "test-skill",
      category: "language",
      name: "Test",
      version: "1.0.0",
      match: { files: [] },
      rules: ["rule1"],
    };

    const result = skillSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects skill with invalid category", () => {
    const invalid = {
      skillId: "test-skill",
      category: "invalid-category",
      name: "Test",
      version: "1.0.0",
      match: { files: ["*.ts"] },
      rules: ["rule1"],
    };

    const result = skillSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("accepts infrastructure category", () => {
    const skill = {
      skillId: "infra-docker",
      category: "infrastructure",
      name: "Docker Best Practices",
      version: "1.0.0",
      match: { files: ["Dockerfile"] },
      rules: ["Use multi-stage builds"],
    };

    const result = skillSchema.safeParse(skill);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("infrastructure");
    }
  });

  it("accepts database category", () => {
    const skill = {
      skillId: "db-postgresql",
      category: "database",
      name: "PostgreSQL Best Practices",
      version: "1.0.0",
      match: { files: ["*.sql"] },
      rules: ["Use parameterized queries"],
    };

    const result = skillSchema.safeParse(skill);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("database");
    }
  });

  it("applies default empty array for antiPatterns", () => {
    const skill = {
      skillId: "test-skill",
      category: "language",
      name: "Test",
      version: "1.0.0",
      match: { files: ["*.ts"] },
      rules: ["rule1"],
    };

    const result = skillSchema.safeParse(skill);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.antiPatterns).toEqual([]);
    }
  });

  it("accepts optional severity mapping", () => {
    const skill = {
      skillId: "test-skill",
      category: "language",
      name: "Test",
      version: "1.0.0",
      match: { files: ["*.ts"] },
      rules: ["rule1"],
      severity: { "rule1": "high" },
    };

    const result = skillSchema.safeParse(skill);
    expect(result.success).toBe(true);
  });
});

describe("configSchema", () => {
  it("validates a complete config", () => {
    const config = {
      version: "1",
      ai: { provider: "anthropic", model: "claude-sonnet-4-20250514" },
      skills: { enabled: ["lang-typescript"], custom: "./custom-skills" },
      scan: { severity: "medium", ignore: ["node_modules"], maxFiles: 1000 },
      fix: { mode: "suggest", maxRisk: "medium", requireVerification: true },
      output: { format: "table", color: true, verbose: false },
    };

    const result = configSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it("applies defaults for missing fields", () => {
    const result = configSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe("1");
      expect(result.data.ai.provider).toBe("anthropic");
      expect(result.data.scan.severity).toBe("low");
      expect(result.data.fix.mode).toBe("suggest");
      expect(result.data.output.format).toBe("table");
    }
  });

  it("rejects invalid AI provider", () => {
    const config = {
      ai: { provider: "invalid-provider" },
    };

    const result = configSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects invalid severity level", () => {
    const config = {
      scan: { severity: "super-critical" },
    };

    const result = configSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects invalid fix mode", () => {
    const config = {
      fix: { mode: "force" },
    };

    const result = configSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects invalid output format", () => {
    const config = {
      output: { format: "xml" },
    };

    const result = configSchema.safeParse(config);
    expect(result.success).toBe(false);
  });
});
