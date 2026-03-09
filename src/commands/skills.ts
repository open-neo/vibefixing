import { SkillRegistry } from "../skills/registry.js";
import { detectProjectStack } from "../skills/detector.js";
import { loadConfig } from "../config/config.js";
import { logger } from "../utils/logger.js";
import { formatJson } from "../utils/output.js";
import type { Skill } from "../types/index.js";

export type SkillsSubcommand = "list" | "show" | "detect" | "add" | "remove";

export interface SkillsOptions {
  subcommand: SkillsSubcommand;
  skillId?: string;
  path?: string;
  format?: "table" | "json";
}

export async function runSkills(options: SkillsOptions): Promise<{
  skills: Skill[];
  output: string;
}> {
  const registry = new SkillRegistry();
  await registry.loadBuiltinSkills();

  // Load custom skills if configured
  const { config } = await loadConfig(options.path);
  if (config.skills.custom) {
    await registry.loadCustomSkills(config.skills.custom);
  }

  switch (options.subcommand) {
    case "list":
      return handleList(registry, config.skills.enabled, options.format);
    case "show":
      return handleShow(registry, options.skillId);
    case "detect":
      return handleDetect(registry, options.path ?? ".");
    case "add":
      return handleAdd(registry, options.skillId);
    case "remove":
      return handleRemove(registry, options.skillId);
    default:
      throw new Error(`Unknown subcommand: ${options.subcommand}`);
  }
}

function handleList(
  registry: SkillRegistry,
  enabledIds: string[],
  format?: "table" | "json"
): { skills: Skill[]; output: string } {
  const skills = registry.getAll();

  if (format === "json") {
    const output = formatJson(skills);
    return { skills, output };
  }

  const lines: string[] = [];
  const idWidth = Math.max(10, ...skills.map((s) => s.skillId.length)) + 2;
  lines.push(
    `${"SKILL ID".padEnd(idWidth)}${"CATEGORY".padEnd(14)}${"STATUS".padEnd(8)}${"NAME"}`
  );
  const lineWidth = idWidth + 14 + 8 + 30;
  lines.push("─".repeat(lineWidth));

  for (const skill of skills) {
    const status = enabledIds.includes(skill.skillId) ? "active" : "avail";
    lines.push(
      `${skill.skillId.padEnd(idWidth)}${skill.category.padEnd(14)}${status.padEnd(8)}${skill.name}`
    );
  }

  lines.push("─".repeat(lineWidth));
  const activeCount = skills.filter((s) =>
    enabledIds.includes(s.skillId)
  ).length;
  lines.push(
    `Total: ${skills.length} skills (${activeCount} active, ${skills.length - activeCount} available)`
  );

  const output = lines.join("\n");
  logger.info(output);
  return { skills, output };
}

function handleShow(
  registry: SkillRegistry,
  skillId?: string
): { skills: Skill[]; output: string } {
  if (!skillId) {
    throw new Error("Skill ID is required for 'skills show'");
  }

  const skill = registry.getById(skillId);
  if (!skill) {
    throw new Error(`Skill not found: ${skillId}`);
  }

  const output = formatJson(skill);
  logger.info(output);
  return { skills: [skill], output };
}

async function handleDetect(
  registry: SkillRegistry,
  path: string
): Promise<{ skills: Skill[]; output: string }> {
  const detection = await detectProjectStack(path);
  const matchedSkills = registry.matchSkills(
    detection.languages,
    detection.frameworks,
    detection.infrastructure,
    detection.databases
  );

  logger.info(`Detected languages: ${detection.languages.join(", ") || "none"}`);
  logger.info(`Detected frameworks: ${detection.frameworks.join(", ") || "none"}`);
  logger.info(`Detected infrastructure: ${detection.infrastructure.join(", ") || "none"}`);
  logger.info(`Detected databases: ${detection.databases.join(", ") || "none"}`);
  logger.info(`Matched skills: ${matchedSkills.map((s) => s.skillId).join(", ") || "none"}`);

  const output = matchedSkills.map((s) => s.skillId).join(", ");
  return { skills: matchedSkills, output };
}

function handleAdd(
  registry: SkillRegistry,
  skillId?: string
): { skills: Skill[]; output: string } {
  if (!skillId) {
    throw new Error("Skill ID is required for 'skills add'");
  }

  const skill = registry.getById(skillId);
  if (!skill) {
    throw new Error(`Skill not found: ${skillId}`);
  }

  logger.success(`Added skill: ${skillId}`);
  return { skills: [skill], output: `Added: ${skillId}` };
}

function handleRemove(
  registry: SkillRegistry,
  skillId?: string
): { skills: Skill[]; output: string } {
  if (!skillId) {
    throw new Error("Skill ID is required for 'skills remove'");
  }

  const removed = registry.removeSkill(skillId);
  if (!removed) {
    throw new Error(`Skill not found: ${skillId}`);
  }

  logger.success(`Removed skill: ${skillId}`);
  return { skills: [], output: `Removed: ${skillId}` };
}
