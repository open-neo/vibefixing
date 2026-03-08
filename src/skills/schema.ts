import { z } from "zod";

export const severitySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
  "info",
]);

export const skillCategorySchema = z.enum([
  "language",
  "framework",
  "architecture",
  "process",
  "security",
]);

export const skillMatchSchema = z.object({
  files: z.array(z.string()).min(1),
  dependencies: z.array(z.string()).optional(),
});

export const skillSchema = z.object({
  skillId: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9-]*$/, "Skill ID must be lowercase alphanumeric with hyphens"),
  category: skillCategorySchema,
  name: z.string().min(1).max(100),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, "Version must be semver format (e.g., 1.0.0)"),
  language: z.string().optional(),
  match: skillMatchSchema,
  rules: z.array(z.string()).min(1),
  antiPatterns: z.array(z.string()).default([]),
  fixTemplates: z.record(z.string()).optional(),
  severity: z.record(severitySchema).optional(),
});

export type SkillSchemaInput = z.input<typeof skillSchema>;
export type SkillSchemaOutput = z.output<typeof skillSchema>;

export const configSchema = z.object({
  version: z.string().default("1"),
  ai: z
    .object({
      provider: z.enum(["anthropic", "openai"]).default("anthropic"),
      model: z.string().optional(),
      apiKey: z.string().optional(),
    })
    .default({}),
  skills: z
    .object({
      enabled: z.array(z.string()).default([]),
      custom: z.string().optional(),
    })
    .default({}),
  scan: z
    .object({
      severity: severitySchema.default("low"),
      ignore: z.array(z.string()).default(["node_modules", ".git", "dist", "build", ".next"]),
      maxFiles: z.number().positive().optional(),
    })
    .default({}),
  fix: z
    .object({
      mode: z.enum(["suggest", "auto"]).default("suggest"),
      maxRisk: z.enum(["low", "medium", "high"]).default("medium"),
      requireVerification: z.boolean().default(true),
    })
    .default({}),
  output: z
    .object({
      format: z.enum(["table", "json", "sarif"]).default("table"),
      color: z.boolean().default(true),
      verbose: z.boolean().default(false),
    })
    .default({}),
});

export type ConfigSchemaInput = z.input<typeof configSchema>;
export type ConfigSchemaOutput = z.output<typeof configSchema>;
