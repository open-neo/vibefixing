import chalk from "chalk";
import type {
  DoctorCheck,
  DoctorReportData,
  Finding,
  ScanResult,
  Severity,
} from "../types/index.js";

const SEVERITY_COLORS: Record<Severity, (text: string) => string> = {
  critical: (t) => chalk.bgRed.white.bold(` ${t} `),
  high: (t) => chalk.red.bold(t),
  medium: (t) => chalk.yellow(t),
  low: (t) => chalk.blue(t),
  info: (t) => chalk.gray(t),
};

export function formatSeverity(severity: Severity): string {
  return SEVERITY_COLORS[severity](severity.toUpperCase());
}

export function formatFindingsTable(findings: Finding[]): string {
  if (findings.length === 0) {
    return chalk.green("No issues found.");
  }

  const header = `${chalk.bold("SEV".padEnd(9))}${chalk.bold("FILE".padEnd(30))}${chalk.bold("ISSUE".padEnd(40))}${chalk.bold("LINE")}`;
  const separator = "─".repeat(85);

  const rows = findings.map((f) => {
    const sev = formatSeverity(f.severity).padEnd(9 + 10); // extra for ANSI codes
    const file = f.filePath.padEnd(30).slice(0, 30);
    const issue = f.title.padEnd(40).slice(0, 40);
    const line = String(f.line);
    return `${sev}${file}${issue}${line}`;
  });

  const counts = countBySeverity(findings);
  const summary = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([sev, count]) => `${count} ${sev}`)
    .join(", ");

  return [
    separator,
    header,
    separator,
    ...rows,
    separator,
    `Total: ${findings.length} findings (${summary})`,
  ].join("\n");
}

export function formatDoctorTable(checks: DoctorCheck[]): string {
  const header = `${chalk.bold("CHECK".padEnd(25))}${chalk.bold("STATUS".padEnd(10))}${chalk.bold("DETAILS")}`;
  const separator = "─".repeat(70);

  const statusIcons: Record<DoctorCheck["status"], string> = {
    pass: chalk.green("✓ PASS"),
    fail: chalk.red("✗ FAIL"),
    warn: chalk.yellow("⚠ WARN"),
    skip: chalk.gray("○ SKIP"),
  };

  const rows = checks.map((c) => {
    const name = c.name.padEnd(25);
    const status = statusIcons[c.status].padEnd(10 + 10); // extra for ANSI
    return `${name}${status}${c.details}`;
  });

  const allPassed = checks.every((c) => c.status === "pass" || c.status === "skip");
  const result = allPassed
    ? chalk.green("Result: All checks passed")
    : chalk.red("Result: Some checks failed");

  return [separator, header, separator, ...rows, separator, result].join("\n");
}

export function renderProgressBar(score: number, width = 20): string {
  const clamped = Math.max(0, Math.min(100, score));
  const filled = Math.round((clamped / 100) * width);
  const empty = width - filled;
  const bar = "\u2588".repeat(filled) + "\u2591".repeat(empty);

  let colorFn: (s: string) => string;
  if (clamped >= 80) colorFn = chalk.green;
  else if (clamped >= 60) colorFn = chalk.yellow;
  else colorFn = chalk.red;

  return `${colorFn(bar)}  ${clamped}`;
}

export function formatBrandHeader(): string {
  return `\n  ${chalk.bold.cyan("VibeFixing")} ${chalk.gray("v0.1.0")}\n`;
}

export function formatDoctorReport(data: DoctorReportData): string {
  const lines: string[] = [];

  // Brand header
  lines.push(formatBrandHeader());

  // Environment section
  lines.push(`  ${chalk.bold("Environment")}`);
  for (const check of data.checks) {
    const icon =
      check.status === "pass"
        ? chalk.green("\u2714")
        : check.status === "fail"
          ? chalk.red("\u2717")
          : check.status === "warn"
            ? chalk.yellow("\u26A0")
            : chalk.gray("\u25CB");
    lines.push(`   ${icon} ${check.name} ${chalk.gray(check.details)}`);
  }
  lines.push("");

  // Skills detected section
  lines.push(`  ${chalk.bold("Skills detected")}`);
  const detectedSkills = data.skills.filter((s) => s.detected);
  if (detectedSkills.length > 0) {
    for (const skill of detectedSkills) {
      lines.push(`   ${chalk.green("\u2714")} ${skill.name}`);
    }
  } else {
    lines.push(`   ${chalk.gray("No skills detected for this project")}`);
  }
  lines.push("");

  // Project Health section
  lines.push(`  ${chalk.bold("Project Health")}`);
  lines.push(`   Architecture   ${renderProgressBar(data.health.architecture)}`);
  lines.push(`   Security       ${renderProgressBar(data.health.security)}`);
  lines.push(`   Quality        ${renderProgressBar(data.health.quality)}`);
  lines.push(`   ${"\u2500".repeat(37)}`);
  lines.push(`   Overall        ${renderProgressBar(data.health.overall)}`);
  lines.push("");

  // Top recommendations
  if (data.recommendations.length > 0) {
    lines.push(`  ${chalk.bold("Top recommendations")}`);
    data.recommendations.forEach((rec, i) => {
      const sevLabel =
        rec.severity === "critical" || rec.severity === "high"
          ? chalk.red(`[${rec.severity}]`)
          : rec.severity === "medium"
            ? chalk.yellow(`[${rec.severity}]`)
            : chalk.blue(`[${rec.severity}]`);
      lines.push(`   ${i + 1}. ${sevLabel.padEnd(18)} ${rec.message}`);
    });
  } else {
    lines.push(`  ${chalk.green("\u2714 No recommendations \u2014 looking good!")}`);
  }

  lines.push("");
  return lines.join("\n");
}

export function formatScanReport(result: ScanResult): string {
  const lines: string[] = [];
  lines.push(formatBrandHeader());

  // Summary
  lines.push(`  ${chalk.bold("Scan Summary")}`);
  lines.push(`   Files scanned   ${chalk.cyan(String(result.filesScanned))}`);
  lines.push(
    `   Skills used     ${chalk.cyan(result.skills.join(", ") || "none")}`
  );
  lines.push(`   Duration        ${chalk.cyan(result.duration + "ms")}`);
  lines.push("");

  if (result.findings.length === 0) {
    lines.push(`  ${chalk.green("\u2714 No issues found.")}`);
    lines.push("");
    return lines.join("\n");
  }

  // Severity counts
  const counts = countBySeverity(result.findings);
  const countParts: string[] = [];
  if (counts.critical > 0)
    countParts.push(chalk.bgRed.white.bold(` ${counts.critical} critical `));
  if (counts.high > 0)
    countParts.push(chalk.red.bold(`${counts.high} high`));
  if (counts.medium > 0)
    countParts.push(chalk.yellow(`${counts.medium} medium`));
  if (counts.low > 0)
    countParts.push(chalk.blue(`${counts.low} low`));
  if (counts.info > 0)
    countParts.push(chalk.gray(`${counts.info} info`));

  lines.push(`  ${chalk.bold("Findings")}  ${countParts.join(chalk.gray("  \u2502  "))}`);
  lines.push("");

  // Findings table
  lines.push(formatFindingsTable(result.findings));

  lines.push("");
  return lines.join("\n");
}

export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

function countBySeverity(findings: Finding[]): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  for (const f of findings) {
    counts[f.severity]++;
  }

  return counts;
}
