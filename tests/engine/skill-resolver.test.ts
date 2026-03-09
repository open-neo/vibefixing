import { describe, it, expect, beforeEach } from "vitest";
import { resolve } from "node:path";
import { resolveSkills } from "../../src/engine/skill-resolver.js";
import { SkillRegistry } from "../../src/skills/registry.js";

const FIXTURES_DIR = resolve(__dirname, "../fixtures/sample-project");

describe("skill-resolver", () => {
  let registry: SkillRegistry;

  beforeEach(async () => {
    registry = new SkillRegistry();
    await registry.loadBuiltinSkills();
  });

  it("resolves skills based on project detection", async () => {
    const resolution = await resolveSkills(FIXTURES_DIR, registry);
    expect(resolution.projectPath).toBe(FIXTURES_DIR);
    expect(resolution.resolvedSkills.length).toBeGreaterThan(0);
  });

  it("detects languages for the fixture project", async () => {
    const resolution = await resolveSkills(FIXTURES_DIR, registry);
    expect(resolution.detectedLanguages).toContain("typescript");
  });

  it("detects frameworks for the fixture project", async () => {
    const resolution = await resolveSkills(FIXTURES_DIR, registry);
    expect(resolution.detectedFrameworks.length).toBeGreaterThan(0);
  });

  it("includes matched file patterns", async () => {
    const resolution = await resolveSkills(FIXTURES_DIR, registry);
    expect(Object.keys(resolution.matchedFiles).length).toBeGreaterThan(0);
  });

  it("uses explicit skill IDs when provided", async () => {
    const resolution = await resolveSkills(FIXTURES_DIR, registry, [
      "lang-typescript",
    ]);
    expect(resolution.resolvedSkills).toEqual(["lang-typescript"]);
  });

  it("filters out non-existent skill IDs", async () => {
    const resolution = await resolveSkills(FIXTURES_DIR, registry, [
      "lang-typescript",
      "nonexistent-skill",
    ]);
    expect(resolution.resolvedSkills).toEqual(["lang-typescript"]);
  });

  it("includes a timestamp", async () => {
    const resolution = await resolveSkills(FIXTURES_DIR, registry);
    expect(resolution.createdAt).toBeDefined();
    expect(() => new Date(resolution.createdAt)).not.toThrow();
  });

  it("includes detected infrastructure in resolution", async () => {
    const resolution = await resolveSkills(FIXTURES_DIR, registry);
    expect(Array.isArray(resolution.detectedInfrastructure)).toBe(true);
  });

  it("includes detected databases in resolution", async () => {
    const resolution = await resolveSkills(FIXTURES_DIR, registry);
    expect(Array.isArray(resolution.detectedDatabases)).toBe(true);
  });
});
