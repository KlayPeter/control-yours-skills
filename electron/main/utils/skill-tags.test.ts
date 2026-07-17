import { describe, expect, it } from "vitest";

import { applySkillTagChanges, normalizeSkillTags } from "./skill-tags";

describe("skill tags", () => {
  it("normalizes case, hashes, whitespace and duplicates", () => {
    expect(normalizeSkillTags([" #Frontend ", "frontend", "中文", ""])).toEqual([
      "frontend",
      "中文"
    ]);
  });

  it("applies additions and removals case-insensitively", () => {
    expect(applySkillTagChanges(["Stable", "team-a"], ["Desktop"], ["#TEAM-A"])).toEqual([
      "stable",
      "desktop"
    ]);
  });
});
