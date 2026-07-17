import { describe, expect, it } from "vitest";

import { resolveScannedSkillCategory } from "./skill-records";

describe("skill record reconciliation", () => {
  it("preserves a category chosen by the user during a disk rescan", () => {
    expect(resolveScannedSkillCategory("reviewed", "physical-folder")).toBe("reviewed");
  });

  it("uses the physical folder for records without a saved category", () => {
    expect(resolveScannedSkillCategory(null, "physical-folder")).toBe("physical-folder");
  });
});
