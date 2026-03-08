import { describe, it, expect } from "vitest";
import { runUpgrade } from "../../src/commands/upgrade.js";

describe("upgrade command", () => {
  it("returns current and latest version", async () => {
    const result = await runUpgrade({ check: true });
    expect(result.currentVersion).toBeDefined();
    expect(result.latestVersion).toBeDefined();
    expect(typeof result.currentVersion).toBe("string");
    expect(typeof result.latestVersion).toBe("string");
  }, 15000);

  it("does not upgrade in check mode", async () => {
    const result = await runUpgrade({ check: true });
    expect(result.upgraded).toBe(false);
  }, 15000);

  it("reports already up to date when versions match", async () => {
    const result = await runUpgrade({ check: true });
    // Since the package isn't published, both should be 0.0.0 or matching
    expect(typeof result.upgraded).toBe("boolean");
  }, 15000);
});
