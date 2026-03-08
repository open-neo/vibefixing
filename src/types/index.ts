export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type FindingStatus = "open" | "fixed" | "ignored" | "false-positive";

export type RiskLevel = "low" | "medium" | "high";

export type PatchStatus = "generated" | "verified" | "applied" | "rejected";

export type FixMode = "suggest" | "auto";

export type OutputFormat = "table" | "json" | "sarif";

export type AIProvider = "anthropic" | "openai";

export type SkillCategory =
  | "language"
  | "framework"
  | "architecture"
  | "process"
  | "security";

export interface Finding {
  id: string;
  filePath: string;
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  severity: Severity;
  status: FindingStatus;
  title: string;
  description: string;
  skillId?: string;
  ruleId?: string;
  suggestedFix?: string;
  createdAt: string;
}

export interface SkillMatch {
  files: string[];
  dependencies?: string[];
}

export interface SkillRule {
  id: string;
  description: string;
  severity: Severity;
}

export interface Skill {
  skillId: string;
  category: SkillCategory;
  name: string;
  version: string;
  language?: string;
  match: SkillMatch;
  rules: string[];
  antiPatterns: string[];
  fixTemplates?: Record<string, string>;
  severity?: Record<string, Severity>;
}

export interface PatchCandidate {
  id: string;
  findingId: string;
  filePath: string;
  originalContent: string;
  patchedContent: string;
  unifiedDiff: string;
  strategy: string;
  aiProvider: AIProvider;
  aiModel: string;
  confidence: number;
  riskLevel: RiskLevel;
  riskScore: number;
  status: PatchStatus;
  createdAt: string;
}

export interface PatchEvaluation {
  id: string;
  patchCandidateId: string;
  compilePassed: boolean;
  typeCheckPassed: boolean;
  testsPassed: boolean;
  securityScanPassed: boolean;
  regressionRisk: "none" | RiskLevel;
  blastRadius: number;
  evaluatedAt: string;
  evaluationDuration: number;
}

export interface SkillResolution {
  projectPath: string;
  detectedLanguages: string[];
  detectedFrameworks: string[];
  resolvedSkills: string[];
  matchedFiles: Record<string, string[]>;
  createdAt: string;
}

export interface VibeFixingConfig {
  version: string;
  ai: {
    provider: AIProvider;
    model?: string;
    apiKey?: string;
  };
  skills: {
    enabled: string[];
    custom?: string;
  };
  scan: {
    severity: Severity;
    ignore: string[];
    maxFiles?: number;
  };
  fix: {
    mode: FixMode;
    maxRisk: RiskLevel;
    requireVerification: boolean;
  };
  output: {
    format: OutputFormat;
    color: boolean;
    verbose: boolean;
  };
}

export interface DoctorCheck {
  name: string;
  status: "pass" | "fail" | "warn" | "skip";
  details: string;
}

export interface ScanResult {
  projectPath: string;
  filesScanned: number;
  skills: string[];
  findings: Finding[];
  duration: number;
}

export interface HealthScore {
  architecture: number;
  security: number;
  quality: number;
  overall: number;
}

export interface Recommendation {
  severity: Severity;
  message: string;
}

export interface DoctorReportData {
  checks: DoctorCheck[];
  skills: DetectedSkillInfo[];
  health: HealthScore;
  recommendations: Recommendation[];
}

export interface DetectedSkillInfo {
  name: string;
  detected: boolean;
}
