import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import fg from "fast-glob";
import { parse as parseYaml } from "yaml";
import { skillSchema } from "./schema.js";
import type { Skill, SkillCategory } from "../types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class SkillRegistry {
  private skills: Map<string, Skill> = new Map();
  private loaded = false;

  async loadBuiltinSkills(): Promise<void> {
    // Built-in skills are in packages/cli/skills/
    const skillsDir = resolve(__dirname, "../../skills");
    await this.loadSkillsFromDir(skillsDir);
    this.loaded = true;
  }

  async loadCustomSkills(customDir: string): Promise<void> {
    await this.loadSkillsFromDir(customDir);
  }

  private async loadSkillsFromDir(dir: string): Promise<void> {
    const yamlFiles = await fg("**/*.yml", {
      cwd: dir,
      absolute: true,
      onlyFiles: true,
    });

    for (const file of yamlFiles) {
      try {
        const content = await readFile(file, "utf-8");
        const data = parseYaml(content);
        const parsed = skillSchema.safeParse(data);
        if (parsed.success) {
          this.skills.set(parsed.data.skillId, parsed.data as Skill);
        }
      } catch {
        // Skip invalid skill files
      }
    }
  }

  getAll(): Skill[] {
    return Array.from(this.skills.values());
  }

  getById(skillId: string): Skill | undefined {
    return this.skills.get(skillId);
  }

  getByCategory(category: SkillCategory): Skill[] {
    return this.getAll().filter((s) => s.category === category);
  }

  getByLanguage(language: string): Skill[] {
    return this.getAll().filter((s) => s.language === language);
  }

  matchSkills(
    languages: string[],
    frameworks: string[]
  ): Skill[] {
    const matched: Skill[] = [];

    for (const skill of this.skills.values()) {
      // Match by language
      if (skill.language && languages.includes(skill.language)) {
        matched.push(skill);
        continue;
      }

      // Match by framework name in skillId
      if (frameworks.some((fw) => skill.skillId.includes(fw))) {
        matched.push(skill);
        continue;
      }

      // Security and architecture skills always match
      if (skill.category === "security" || skill.category === "architecture") {
        matched.push(skill);
      }
    }

    return matched;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  count(): number {
    return this.skills.size;
  }

  addSkill(skill: Skill): void {
    this.skills.set(skill.skillId, skill);
  }

  removeSkill(skillId: string): boolean {
    return this.skills.delete(skillId);
  }
}
