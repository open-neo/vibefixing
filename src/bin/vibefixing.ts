import { Command } from "commander";
import { runInit } from "../commands/init.js";
import { runConfig } from "../commands/config.js";
import { runSkills } from "../commands/skills.js";
import { runScan } from "../commands/scan.js";
import { runDoctor } from "../commands/doctor.js";
import { runUpgrade } from "../commands/upgrade.js";
import { setLogLevel } from "../utils/logger.js";

const program = new Command();

program
  .name("vibefixing")
  .description("AI-powered code analysis and auto-fixing CLI tool")
  .version("0.1.0")
  .option("--verbose", "Enable verbose output")
  .hook("preAction", (thisCommand) => {
    if (thisCommand.opts().verbose) {
      setLogLevel("debug");
    }
  });

// scan command
program
  .command("scan")
  .description("Scan project files for code quality and security issues")
  .argument("[path]", "Target directory", ".")
  .option("--skills <ids>", "Comma-separated skill IDs to use")
  .option("--severity <level>", "Minimum severity: info|low|medium|high|critical")
  .option("--format <fmt>", "Output format: table|json|sarif", "table")
  .option("--output <file>", "Write results to file")
  .option("--ignore <patterns>", "Glob patterns to ignore")
  .option("--no-ai", "Skip AI analysis, use rules only")
  .action(async (path, opts) => {
    try {
      const result = await runScan({ path, ...opts });
      process.exit(result.findings.length > 0 ? 1 : 0);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(2);
    }
  });

// doctor command
program
  .command("doctor")
  .description("Check environment health and configuration")
  .action(async () => {
    try {
      const result = await runDoctor({});
      process.exit(result.allPassed ? 0 : 1);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(2);
    }
  });

// skills command
const skillsCmd = program
  .command("skills")
  .description("Manage SKILLS packs for code analysis");

skillsCmd
  .command("list")
  .description("List all available skills")
  .option("--format <fmt>", "Output format: table|json")
  .action(async (opts) => {
    try {
      await runSkills({ subcommand: "list", format: opts.format });
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(2);
    }
  });

skillsCmd
  .command("show")
  .description("Show detailed info for a skill")
  .argument("<id>", "Skill ID")
  .action(async (id) => {
    try {
      await runSkills({ subcommand: "show", skillId: id });
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(2);
    }
  });

skillsCmd
  .command("detect")
  .description("Auto-detect applicable skills for current project")
  .argument("[path]", "Project path", ".")
  .action(async (path) => {
    try {
      await runSkills({ subcommand: "detect", path });
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(2);
    }
  });

skillsCmd
  .command("add")
  .description("Add a skill to project config")
  .argument("<id>", "Skill ID")
  .action(async (id) => {
    try {
      await runSkills({ subcommand: "add", skillId: id });
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(2);
    }
  });

skillsCmd
  .command("remove")
  .description("Remove a skill from project config")
  .argument("<id>", "Skill ID")
  .action(async (id) => {
    try {
      await runSkills({ subcommand: "remove", skillId: id });
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(2);
    }
  });

// init command
program
  .command("init")
  .description("Initialize VibeFixing configuration for a project")
  .argument("[path]", "Project path", ".")
  .option("--yes", "Non-interactive mode with defaults")
  .option("--provider <name>", "Default AI provider")
  .option("--template <name>", "Config template to use")
  .action(async (path, opts) => {
    try {
      await runInit({ path, yes: opts.yes ?? false, provider: opts.provider, template: opts.template });
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(2);
    }
  });

// config command
const configCmd = program
  .command("config")
  .description("Manage VibeFixing configuration");

configCmd
  .command("get")
  .description("Get a config value")
  .argument("<key>", "Config key (e.g., ai.provider)")
  .action(async (key) => {
    try {
      await runConfig({ subcommand: "get", key });
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(2);
    }
  });

configCmd
  .command("set")
  .description("Set a config value")
  .argument("<key>", "Config key")
  .argument("<value>", "Config value")
  .action(async (key, value) => {
    try {
      await runConfig({ subcommand: "set", key, value });
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(2);
    }
  });

configCmd
  .command("list")
  .description("List all config values")
  .action(async () => {
    try {
      await runConfig({ subcommand: "list" });
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(2);
    }
  });

configCmd
  .command("reset")
  .description("Reset config to defaults")
  .action(async () => {
    try {
      await runConfig({ subcommand: "reset" });
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(2);
    }
  });

// upgrade command
program
  .command("upgrade")
  .description("Self-update VibeFixing CLI")
  .option("--check", "Check for updates without installing")
  .option("--force", "Force upgrade even if current")
  .action(async (opts) => {
    try {
      await runUpgrade(opts);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(2);
    }
  });

program.parse();
