import { writeFile } from "node:fs/promises";
import { stringify as yamlStringify } from "yaml";
import { loadConfig, getConfigValue, setConfigValue } from "../config/config.js";
import { logger } from "../utils/logger.js";
import { formatJson } from "../utils/output.js";
import type { VibeFixingConfig } from "../types/index.js";

export type ConfigSubcommand = "get" | "set" | "list" | "reset";

export interface ConfigOptions {
  subcommand: ConfigSubcommand;
  key?: string;
  value?: string;
  path?: string;
}

export async function runConfig(options: ConfigOptions): Promise<string> {
  const { config, filepath } = await loadConfig(options.path);

  switch (options.subcommand) {
    case "get":
      return handleGet(config, options.key);
    case "set":
      return handleSet(config, filepath, options.key, options.value);
    case "list":
      return handleList(config);
    case "reset":
      return handleReset(filepath);
    default:
      throw new Error(`Unknown subcommand: ${options.subcommand}`);
  }
}

function handleGet(config: VibeFixingConfig, key?: string): string {
  if (!key) {
    throw new Error("Key is required for 'config get'");
  }

  const value = getConfigValue(config, key);
  if (value === undefined) {
    throw new Error(`Config key not found: ${key}`);
  }

  const output =
    typeof value === "object" ? formatJson(value) : String(value);
  logger.info(output);
  return output;
}

async function handleSet(
  config: VibeFixingConfig,
  filepath: string | null,
  key?: string,
  value?: string
): Promise<string> {
  if (!key || value === undefined) {
    throw new Error("Key and value are required for 'config set'");
  }

  if (!filepath) {
    throw new Error(
      "No config file found. Run 'vibefixing init' first."
    );
  }

  // Parse value (try JSON, then boolean, then number, then string)
  let parsedValue: unknown = value;
  if (value === "true") parsedValue = true;
  else if (value === "false") parsedValue = false;
  else if (/^\d+$/.test(value)) parsedValue = parseInt(value, 10);
  else {
    try {
      parsedValue = JSON.parse(value);
    } catch {
      // Keep as string
    }
  }

  const updated = setConfigValue(config, key, parsedValue);
  const yamlContent = yamlStringify(updated);
  await writeFile(filepath, yamlContent, "utf-8");

  logger.success(`Set ${key} = ${value}`);
  return `${key} = ${value}`;
}

function handleList(config: VibeFixingConfig): string {
  const output = formatJson(config);
  logger.info(output);
  return output;
}

async function handleReset(filepath: string | null): Promise<string> {
  if (!filepath) {
    throw new Error("No config file found. Nothing to reset.");
  }

  const { DEFAULT_CONFIG } = await import("../config/config.js");
  const yamlContent = yamlStringify(DEFAULT_CONFIG);
  await writeFile(filepath, yamlContent, "utf-8");

  logger.success("Config reset to defaults");
  return "Config reset to defaults";
}
