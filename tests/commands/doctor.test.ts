import { describe, it, expect } from "vitest";
import { runDoctor } from "../../src/commands/doctor.js";

describe("doctor command", () => {
  it("returns a list of checks", async () => {
    const result = await runDoctor({});
    expect(result.checks).toBeDefined();
    expect(result.checks.length).toBeGreaterThan(0);
  });

  it("checks Node.js version", async () => {
    const result = await runDoctor({});
    const nodeCheck = result.checks.find((c) => c.name === "Node.js");
    expect(nodeCheck).toBeDefined();
    expect(nodeCheck?.status).toBe("pass");
  });

  it("checks Git availability", async () => {
    const result = await runDoctor({});
    const gitCheck = result.checks.find((c) => c.name === "Git");
    expect(gitCheck).toBeDefined();
    expect(gitCheck?.status).toBe("pass");
  });

  it("checks AI provider configuration", async () => {
    const result = await runDoctor({});
    const aiCheck = result.checks.find((c) =>
      c.name.includes("AI Provider")
    );
    expect(aiCheck).toBeDefined();
  });

  it("checks SKILLS integrity", async () => {
    const result = await runDoctor({});
    const skillsCheck = result.checks.find((c) => c.name === "SKILLS Integrity");
    expect(skillsCheck).toBeDefined();
    expect(skillsCheck?.status).toBe("pass");
  });

  it("returns allPassed boolean", async () => {
    const result = await runDoctor({});
    expect(typeof result.allPassed).toBe("boolean");
  });

  it("each check has name, status, and details", async () => {
    const result = await runDoctor({});
    for (const check of result.checks) {
      expect(check).toHaveProperty("name");
      expect(check).toHaveProperty("status");
      expect(check).toHaveProperty("details");
      expect(["pass", "fail", "warn", "skip"]).toContain(check.status);
    }
  });
});
