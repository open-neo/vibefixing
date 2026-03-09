import { execSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface UpgradeOptions {
  check?: boolean;
  force?: boolean;
}

export async function runUpgrade(options: UpgradeOptions): Promise<{
  currentVersion: string;
  latestVersion: string;
  upgraded: boolean;
}> {
  const currentVersion = await getCurrentVersion();
  const latestVersion = await getLatestVersion();

  logger.info(`Current version: ${currentVersion}`);
  logger.info(`Latest version:  ${latestVersion}`);

  if (currentVersion === latestVersion && !options.force) {
    logger.success("Already up to date!");
    return { currentVersion, latestVersion, upgraded: false };
  }

  if (options.check) {
    if (currentVersion !== latestVersion) {
      logger.info(`\nUpdate available: ${currentVersion} → ${latestVersion}`);
      logger.info('Run "vibefixing upgrade" to update');
    }
    return { currentVersion, latestVersion, upgraded: false };
  }

  // Perform upgrade
  if (process.env.VIBEFIXING_INSTALLED_VIA === "pip") {
    logger.info(
      "\nInstalled via pip. Run the following to upgrade:\n  pip install --upgrade vibefixing"
    );
    return { currentVersion, latestVersion, upgraded: false };
  }

  logger.info(`\nUpgrading ${currentVersion} → ${latestVersion}...`);

  try {
    execSync("npm install -g vibefixing@latest", {
      encoding: "utf-8",
      stdio: "pipe",
    });
    logger.success(`Upgraded to ${latestVersion}`);
    return { currentVersion, latestVersion, upgraded: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Upgrade failed: ${message}`);
  }
}

async function getCurrentVersion(): Promise<string> {
  try {
    const pkgPath = resolve(__dirname, "../../package.json");
    const content = await readFile(pkgPath, "utf-8");
    const pkg = JSON.parse(content);
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

async function getLatestVersion(): Promise<string> {
  try {
    const output = execSync("npm view vibefixing version 2>/dev/null", {
      encoding: "utf-8",
    }).trim();
    return output || "0.0.0";
  } catch {
    return "0.0.0";
  }
}
