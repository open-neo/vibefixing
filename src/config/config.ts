import { cosmiconfig } from "cosmiconfig";
import { configSchema, type ConfigSchemaOutput } from "../skills/schema.js";
import type { VibeFixingConfig } from "../types/index.js";

const CONFIG_NAME = "vibefixing";

const searchPlaces = [
  `.${CONFIG_NAME}.yml`,
  `.${CONFIG_NAME}.yaml`,
  `.${CONFIG_NAME}.json`,
  `.${CONFIG_NAME}rc`,
  `.${CONFIG_NAME}rc.yml`,
  `.${CONFIG_NAME}rc.yaml`,
  `.${CONFIG_NAME}rc.json`,
];

function createExplorer() {
  return cosmiconfig(CONFIG_NAME, { searchPlaces });
}

export const DEFAULT_CONFIG: VibeFixingConfig = {
  version: "1",
  ai: {
    provider: "anthropic",
  },
  skills: {
    enabled: [],
  },
  scan: {
    severity: "low",
    ignore: ["node_modules", ".git", "dist", "build", ".next"],
  },
  fix: {
    mode: "suggest",
    maxRisk: "medium",
    requireVerification: true,
  },
  output: {
    format: "table",
    color: true,
    verbose: false,
  },
};

export async function loadConfig(
  searchFrom?: string
): Promise<{ config: VibeFixingConfig; filepath: string | null }> {
  const explorer = createExplorer();
  const result = await explorer.search(searchFrom);

  if (!result || result.isEmpty) {
    return { config: DEFAULT_CONFIG, filepath: null };
  }

  const parsed = configSchema.safeParse(result.config);
  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid config in ${result.filepath}:\n${errors}`);
  }

  return {
    config: parsed.data as VibeFixingConfig,
    filepath: result.filepath,
  };
}

export function getConfigValue(
  config: VibeFixingConfig,
  key: string
): unknown {
  const parts = key.split(".");
  let current: unknown = config;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

export function setConfigValue(
  config: VibeFixingConfig,
  key: string,
  value: unknown
): VibeFixingConfig {
  const parts = key.split(".");
  const result = structuredClone(config);
  let current: Record<string, unknown> = result as unknown as Record<string, unknown>;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (typeof current[part] !== "object" || current[part] === null) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  const lastPart = parts[parts.length - 1];
  current[lastPart] = value;

  const parsed = configSchema.safeParse(result);
  if (!parsed.success) {
    throw new Error(`Invalid value for ${key}: ${parsed.error.issues[0].message}`);
  }

  return parsed.data as VibeFixingConfig;
}
