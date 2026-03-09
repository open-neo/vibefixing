import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { detectProjectStack } from "../../src/skills/detector.js";

const FIXTURES_DIR = resolve(__dirname, "../fixtures/sample-project");

describe("detectProjectStack", () => {
  it("detects TypeScript from tsconfig.json", async () => {
    const result = await detectProjectStack(FIXTURES_DIR);
    expect(result.languages).toContain("typescript");
  });

  it("detects Next.js framework from package.json dependencies", async () => {
    const result = await detectProjectStack(FIXTURES_DIR);
    expect(result.frameworks).toContain("nextjs");
  });

  it("detects React framework from package.json dependencies", async () => {
    const result = await detectProjectStack(FIXTURES_DIR);
    expect(result.frameworks).toContain("react");
  });

  it("returns empty arrays for a directory with no recognizable files", async () => {
    const result = await detectProjectStack("/tmp");
    expect(result.languages).toEqual([]);
    expect(result.frameworks).toEqual([]);
    expect(result.infrastructure).toEqual([]);
    expect(result.databases).toEqual([]);
  });

  it("detects package managers", async () => {
    const result = await detectProjectStack(FIXTURES_DIR);
    expect(Array.isArray(result.packageManagers)).toBe(true);
    expect(result.packageManagers.length).toBeGreaterThan(0);
  });

  it("returns infrastructure as an array", async () => {
    const result = await detectProjectStack(FIXTURES_DIR);
    expect(Array.isArray(result.infrastructure)).toBe(true);
  });

  it("returns databases as an array", async () => {
    const result = await detectProjectStack(FIXTURES_DIR);
    expect(Array.isArray(result.databases)).toBe(true);
  });
});
