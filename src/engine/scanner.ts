import { resolve, relative, extname } from "node:path";
import { discoverFiles, readFileContent } from "../utils/file.js";
import type { Finding, Severity, Skill } from "../types/index.js";

export interface ScanOptions {
  rootPath: string;
  skills: Skill[];
  severity: Severity;
  ignore: string[];
  maxFiles?: number;
}

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

export async function scanProject(options: ScanOptions): Promise<{
  findings: Finding[];
  filesScanned: number;
}> {
  const { rootPath, skills, severity, ignore, maxFiles } = options;

  // Collect file patterns from skills
  const filePatterns = new Set<string>();
  for (const skill of skills) {
    for (const pattern of skill.match.files) {
      filePatterns.add(pattern);
    }
  }

  if (filePatterns.size === 0) {
    filePatterns.add("**/*");
  }

  // Ensure glob patterns traverse subdirectories
  const expandedPatterns = Array.from(filePatterns).map((p) =>
    p.startsWith("**/") || p.startsWith("/") ? p : `**/${p}`
  );

  let files = await discoverFiles(
    rootPath,
    expandedPatterns,
    ignore
  );

  if (maxFiles && files.length > maxFiles) {
    files = files.slice(0, maxFiles);
  }

  const findings: Finding[] = [];
  let findingId = 1;

  for (const file of files) {
    const relativePath = relative(rootPath, file);
    const ext = extname(file);

    try {
      const content = await readFileContent(file);
      const lines = content.split("\n");

      for (const skill of skills) {
        // Check if this skill's file patterns match this file
        if (!matchesFilePatterns(relativePath, ext, skill.match.files)) {
          continue;
        }

        // Apply anti-pattern detection
        for (const antiPattern of skill.antiPatterns) {
          for (let i = 0; i < lines.length; i++) {
            if (matchesAntiPattern(lines[i], antiPattern)) {
              const findingSeverity = skill.severity?.[antiPattern] ?? "medium";

              if (SEVERITY_ORDER[findingSeverity] >= SEVERITY_ORDER[severity]) {
                findings.push({
                  id: `finding-${findingId++}`,
                  filePath: relativePath,
                  line: i + 1,
                  severity: findingSeverity,
                  status: "open",
                  title: antiPattern,
                  description: `Anti-pattern detected: ${antiPattern}`,
                  skillId: skill.skillId,
                  createdAt: new Date().toISOString(),
                });
              }
            }
          }
        }
      }
    } catch {
      // Skip files that can't be read
    }
  }

  // Sort findings by severity (critical first)
  findings.sort(
    (a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]
  );

  return { findings, filesScanned: files.length };
}

function matchesFilePatterns(
  relativePath: string,
  ext: string,
  patterns: string[]
): boolean {
  for (const pattern of patterns) {
    if (pattern.startsWith("*.")) {
      const targetExt = pattern.slice(1);
      if (ext === targetExt) return true;
    } else if (relativePath.includes(pattern)) {
      return true;
    }
  }
  return false;
}

function matchesAntiPattern(line: string, pattern: string): boolean {
  const normalized = line.trim().toLowerCase();
  const patternLower = pattern.toLowerCase();

  // Simple keyword-based matching
  const keywords = patternLower
    .replace(/['"]/g, "")
    .split(/\s+/)
    .filter((k) => k.length > 2);

  return keywords.every((keyword) => normalized.includes(keyword));
}
