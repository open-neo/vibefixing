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
  });

  it("detects package manager", async () => {
    const result = await detectProjectStack(FIXTURES_DIR);
    expect(typeof result.packageManager).toBe("string");
  });
});
