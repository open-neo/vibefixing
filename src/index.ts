// Public API exports
export type {
  Finding,
  Severity,
  Skill,
  SkillCategory,
  SkillResolution,
  VibeFixingConfig,
  DoctorCheck,
  ScanResult,
  OutputFormat,
  AIProvider,
} from "./types/index.js";

export { skillSchema, configSchema } from "./skills/schema.js";
export { SkillRegistry } from "./skills/registry.js";
export { detectProjectStack } from "./skills/detector.js";
export { loadConfig, getConfigValue, setConfigValue } from "./config/config.js";
export { scanProject } from "./engine/scanner.js";
export { resolveSkills } from "./engine/skill-resolver.js";
