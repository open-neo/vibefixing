import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { runSkills } from "../../src/commands/skills.js";

const FIXTURES_DIR = resolve(__dirname, "../fixtures/sample-project");

describe("skills command", () => {
  describe("list subcommand", () => {
    it("lists all available skills", async () => {
      const result = await runSkills({ subcommand: "list" });
      expect(result.skills.length).toBeGreaterThan(0);
    });

    it("outputs in table format by default", async () => {
      const result = await runSkills({ subcommand: "list" });
      expect(result.output).toContain("SKILL ID");
      expect(result.output).toContain("CATEGORY");
    });

    it("outputs in JSON format", async () => {
      const result = await runSkills({ subcommand: "list", format: "json" });
      const parsed = JSON.parse(result.output);
      expect(Array.isArray(parsed)).toBe(true);
    });
  });

  describe("show subcommand", () => {
    it("shows details for a valid skill ID", async () => {
      const result = await runSkills({
        subcommand: "show",
        skillId: "lang-typescript",
      });
      expect(result.skills.length).toBe(1);
      expect(result.skills[0].skillId).toBe("lang-typescript");
    });

    it("throws for invalid skill ID", async () => {
      await expect(
        runSkills({ subcommand: "show", skillId: "nonexistent" })
      ).rejects.toThrow("not found");
    });

    it("throws when skill ID is missing", async () => {
      await expect(
        runSkills({ subcommand: "show" })
      ).rejects.toThrow("required");
    });
  });

  describe("detect subcommand", () => {
    it("detects skills for a TypeScript/Next.js project", async () => {
      const result = await runSkills({
        subcommand: "detect",
        path: FIXTURES_DIR,
      });
      const skillIds = result.skills.map((s) => s.skillId);
      expect(skillIds).toContain("lang-typescript");
    });
  });

  describe("add subcommand", () => {
    it("adds a valid skill", async () => {
      const result = await runSkills({
        subcommand: "add",
        skillId: "lang-typescript",
      });
      expect(result.output).toContain("Added");
    });

    it("throws for non-existent skill", async () => {
      await expect(
        runSkills({ subcommand: "add", skillId: "nonexistent" })
      ).rejects.toThrow("not found");
    });
  });

  describe("remove subcommand", () => {
    it("throws when skill ID is missing", async () => {
      await expect(
        runSkills({ subcommand: "remove" })
      ).rejects.toThrow("required");
    });
  });
});
