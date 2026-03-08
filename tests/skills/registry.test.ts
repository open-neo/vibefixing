import { describe, it, expect, beforeEach } from "vitest";
import { SkillRegistry } from "../../src/skills/registry.js";
import { resolve } from "node:path";
import type { Skill } from "../../src/types/index.js";

describe("SkillRegistry", () => {
  let registry: SkillRegistry;

  beforeEach(() => {
    registry = new SkillRegistry();
  });

  it("starts with no skills loaded", () => {
    expect(registry.count()).toBe(0);
    expect(registry.isLoaded()).toBe(false);
  });

  it("loads built-in skills", async () => {
    await registry.loadBuiltinSkills();
    expect(registry.isLoaded()).toBe(true);
    expect(registry.count()).toBeGreaterThan(0);
  });

  it("gets a skill by ID", async () => {
    await registry.loadBuiltinSkills();
    const skill = registry.getById("lang-typescript");
    expect(skill).toBeDefined();
    expect(skill?.name).toBe("TypeScript Best Practices");
  });

  it("returns undefined for non-existent skill", async () => {
    await registry.loadBuiltinSkills();
    const skill = registry.getById("nonexistent-skill");
    expect(skill).toBeUndefined();
  });

  it("gets skills by category", async () => {
    await registry.loadBuiltinSkills();
    const languageSkills = registry.getByCategory("language");
    expect(languageSkills.length).toBeGreaterThan(0);
    expect(languageSkills.every((s) => s.category === "language")).toBe(true);
  });

  it("gets skills by language", async () => {
    await registry.loadBuiltinSkills();
    const tsSkills = registry.getByLanguage("typescript");
    expect(tsSkills.length).toBeGreaterThan(0);
    expect(tsSkills.every((s) => s.language === "typescript")).toBe(true);
  });

  it("matches skills based on detected languages", async () => {
    await registry.loadBuiltinSkills();
    const matched = registry.matchSkills(["typescript"], []);
    expect(matched.some((s) => s.skillId === "lang-typescript")).toBe(true);
  });

  it("matches skills based on detected frameworks", async () => {
    await registry.loadBuiltinSkills();
    const matched = registry.matchSkills([], ["nextjs"]);
    expect(matched.some((s) => s.skillId === "fw-nextjs")).toBe(true);
  });

  it("always includes security skills in match results", async () => {
    await registry.loadBuiltinSkills();
    const matched = registry.matchSkills(["typescript"], []);
    expect(matched.some((s) => s.category === "security")).toBe(true);
  });

  it("can add and remove skills programmatically", () => {
    const testSkill: Skill = {
      skillId: "test-skill",
      category: "language",
      name: "Test Skill",
      version: "1.0.0",
      match: { files: ["*.ts"] },
      rules: ["Test rule"],
      antiPatterns: [],
    };

    registry.addSkill(testSkill);
    expect(registry.count()).toBe(1);
    expect(registry.getById("test-skill")).toBeDefined();

    const removed = registry.removeSkill("test-skill");
    expect(removed).toBe(true);
    expect(registry.count()).toBe(0);
  });

  it("loads custom skills from a directory", async () => {
    const customDir = resolve(__dirname, "../fixtures/skills");
    await registry.loadCustomSkills(customDir);
    const skill = registry.getById("test-skill");
    expect(skill).toBeDefined();
    expect(skill?.name).toBe("Test Skill");
  });

  it("getAll returns all loaded skills", async () => {
    await registry.loadBuiltinSkills();
    const all = registry.getAll();
    expect(all.length).toBe(registry.count());
  });
});
