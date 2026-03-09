import type { Skill, SkillResolution } from "../types/index.js";
import { SkillRegistry } from "../skills/registry.js";
import { detectProjectStack } from "../skills/detector.js";

export async function resolveSkills(
  rootPath: string,
  registry: SkillRegistry,
  enabledSkillIds?: string[]
): Promise<SkillResolution> {
  const detection = await detectProjectStack(rootPath);

  let resolvedSkills: Skill[];

  if (enabledSkillIds && enabledSkillIds.length > 0) {
    // Use explicitly enabled skills
    resolvedSkills = enabledSkillIds
      .map((id) => registry.getById(id))
      .filter((s): s is Skill => s !== undefined);
  } else {
    // Auto-detect and match skills
    resolvedSkills = registry.matchSkills(
      detection.languages,
      detection.frameworks,
      detection.infrastructure,
      detection.databases
    );
  }

  const matchedFiles: Record<string, string[]> = {};
  for (const skill of resolvedSkills) {
    matchedFiles[skill.skillId] = skill.match.files;
  }

  return {
    projectPath: rootPath,
    detectedLanguages: detection.languages,
    detectedFrameworks: detection.frameworks,
    detectedInfrastructure: detection.infrastructure,
    detectedDatabases: detection.databases,
    resolvedSkills: resolvedSkills.map((s) => s.skillId),
    matchedFiles,
    createdAt: new Date().toISOString(),
  };
}
