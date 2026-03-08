import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolve } from "node:path";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { runInit } from "../../src/commands/init.js";

describe("init command", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(resolve(tmpdir(), "vibefixing-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("creates .vibefixing.yml in the specified directory", async () => {
    const result = await runInit({ path: tempDir, yes: true });
    expect(result.configPath).toBe(resolve(tempDir, ".vibefixing.yml"));

    const content = await readFile(result.configPath, "utf-8");
    expect(content).toContain("version");
    expect(content).toContain("ai");
  });

  it("returns a valid config object", async () => {
    const result = await runInit({ path: tempDir, yes: true });
    expect(result.config).toBeDefined();
    expect(result.config.version).toBe("1");
    expect(result.config.ai.provider).toBe("anthropic");
  });

  it("detects project languages and frameworks", async () => {
    const result = await runInit({ path: tempDir, yes: true });
    expect(result.detection).toBeDefined();
    expect(Array.isArray(result.detection.languages)).toBe(true);
    expect(Array.isArray(result.detection.frameworks)).toBe(true);
  });

  it("throws if config exists and --yes not provided", async () => {
    // Create first
    await runInit({ path: tempDir, yes: true });

    // Should throw without --yes
    await expect(
      runInit({ path: tempDir, yes: false })
    ).rejects.toThrow("already exists");
  });

  it("overwrites existing config with --yes", async () => {
    await runInit({ path: tempDir, yes: true });
    const result = await runInit({ path: tempDir, yes: true });
    expect(result.configPath).toBeDefined();
  });

  it("respects --provider flag", async () => {
    const result = await runInit({
      path: tempDir,
      yes: true,
      provider: "openai",
    });
    expect(result.config.ai.provider).toBe("openai");
  });
});
