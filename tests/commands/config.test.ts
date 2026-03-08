import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolve } from "node:path";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { stringify as yamlStringify } from "yaml";
import { runConfig } from "../../src/commands/config.js";
import { DEFAULT_CONFIG } from "../../src/config/config.js";

describe("config command", () => {
  let tempDir: string;
  let configPath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(resolve(tmpdir(), "vibefixing-test-"));
    configPath = resolve(tempDir, ".vibefixing.yml");
    await writeFile(configPath, yamlStringify(DEFAULT_CONFIG), "utf-8");
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("gets a config value", async () => {
    const result = await runConfig({
      subcommand: "get",
      key: "ai.provider",
      path: tempDir,
    });
    expect(result).toBe("anthropic");
  });

  it("throws for non-existent config key", async () => {
    await expect(
      runConfig({
        subcommand: "get",
        key: "nonexistent.key",
        path: tempDir,
      })
    ).rejects.toThrow("not found");
  });

  it("sets a config value", async () => {
    await runConfig({
      subcommand: "set",
      key: "ai.provider",
      value: "openai",
      path: tempDir,
    });

    const result = await runConfig({
      subcommand: "get",
      key: "ai.provider",
      path: tempDir,
    });
    expect(result).toBe("openai");
  });

  it("lists all config values", async () => {
    const result = await runConfig({
      subcommand: "list",
      path: tempDir,
    });
    expect(result).toContain("anthropic");
    expect(result).toContain("version");
  });

  it("resets config to defaults", async () => {
    // First set a custom value
    await runConfig({
      subcommand: "set",
      key: "ai.provider",
      value: "openai",
      path: tempDir,
    });

    // Reset
    await runConfig({
      subcommand: "reset",
      path: tempDir,
    });

    // Verify reset
    const result = await runConfig({
      subcommand: "get",
      key: "ai.provider",
      path: tempDir,
    });
    expect(result).toBe("anthropic");
  });

  it("throws when key missing for get", async () => {
    await expect(
      runConfig({ subcommand: "get", path: tempDir })
    ).rejects.toThrow("Key is required");
  });

  it("throws when key or value missing for set", async () => {
    await expect(
      runConfig({ subcommand: "set", path: tempDir })
    ).rejects.toThrow("Key and value are required");
  });

  it("throws for invalid value on set", async () => {
    await expect(
      runConfig({
        subcommand: "set",
        key: "ai.provider",
        value: "invalid-provider",
        path: tempDir,
      })
    ).rejects.toThrow();
  });
});
