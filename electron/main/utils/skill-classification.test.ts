import { describe, expect, it } from "vitest";

import { classifySkill } from "./skill-classification";

describe("classifySkill", () => {
  it("classifies image-related skills from name and description", () => {
    const result = classifySkill({
      name: "Remove Background",
      description: "Clean up product photos and PNG logos.",
      sourceValue: "/tmp/remove-background"
    });

    expect(result.suggestedCategory).toBe("image");
    expect(result.classificationConfidence).not.toBeNull();
  });

  it("classifies programming skills from repository-style metadata", () => {
    const result = classifySkill({
      name: "PR Reviewer",
      description: "Automates pull request review for TypeScript repositories.",
      sourceValue: "/tmp/pr-reviewer"
    });

    expect(result.suggestedCategory).toBe("programming");
  });

  it("falls back to null when no strong rule matches", () => {
    const result = classifySkill({
      name: "Helper",
      description: "A small utility.",
      sourceValue: "/tmp/helper"
    });

    expect(result.suggestedCategory).toBeNull();
    expect(result.classificationReason).toBeNull();
  });
});
