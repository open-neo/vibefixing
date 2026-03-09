import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { stringify as yamlStringify } from "yaml";
import { detectProjectStack } from "../skills/detector.js";
import { SkillRegistry } from "../skills/registry.js";
import { DEFAULT_CONFIG } from "../config/config.js";
import { fileExists } from "../utils/file.js";
import { logger } from "../utils/logger.js";
import type { VibeFixingConfig } from "../types/index.js";

export interface InitOptions {
  path: string;
  yes: boolean;
  provider?: string;
  template?: string;
}

export async function runInit(options: InitOptions): Promise<{
  configPath: string;
  config: VibeFixingConfig;
  detection: { languages: string[]; frameworks: string[]; packageManagers: string[] };
}> {
  const rootPath = resolve(options.path);
  const configPath = resolve(rootPath, ".vibefixing.yml");

  // Check if config already exists
  if (await fileExists(configPath)) {
    if (!options.yes) {
      throw new Error(
        `.vibefixing.yml already exists at ${configPath}. Use --yes to overwrite.`
      );
    }
    logger.warn("Overwriting existing .vibefixing.yml");
  }

  // Detect project stack
  const detection = await detectProjectStack(rootPath);
  logger.info(`Detected languages: ${detection.languages.join(", ") || "none"}`);
  logger.info(`Detected frameworks: ${detection.frameworks.join(", ") || "none"}`);
  logger.info(`Package managers: ${detection.packageManagers.join(", ")}`);

  // Resolve matching skills
  const registry = new SkillRegistry();
  await registry.loadBuiltinSkills();
  const matchedSkills = registry.matchSkills(
    detection.languages,
    detection.frameworks
  );

  // Build config
  const config: VibeFixingConfig = {
    ...DEFAULT_CONFIG,
    ai: {
      ...DEFAULT_CONFIG.ai,
      provider: (options.provider as "anthropic" | "openai") ?? DEFAULT_CONFIG.ai.provider,
    },
    skills: {
      ...DEFAULT_CONFIG.skills,
      enabled: matchedSkills.map((s) => s.skillId),
    },
  };

  // Write config file
  const yamlContent = yamlStringify(config);
  await writeFile(configPath, yamlContent, "utf-8");

  logger.success(`Created ${configPath}`);
  logger.info(`Enabled ${matchedSkills.length} skills: ${matchedSkills.map((s) => s.skillId).join(", ")}`);

  return { configPath, config, detection };
}
