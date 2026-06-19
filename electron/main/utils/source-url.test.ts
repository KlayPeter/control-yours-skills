import { describe, expect, it } from "vitest";

import {
  detectSourceType,
  isGitHubRepoUrl,
  resolveGitHubArchiveUrl,
  validateRemoteSource
} from "./source-url";

describe("source-url helpers", () => {
  it("recognizes GitHub repository URLs", () => {
    expect(isGitHubRepoUrl("https://github.com/openai/codex")).toBe(true);
    expect(detectSourceType("https://github.com/openai/codex")).toBe("githubRepo");
  });

  it("converts GitHub repositories to HEAD.zip downloads", () => {
    expect(resolveGitHubArchiveUrl("https://github.com/openai/codex")).toBe(
      "https://github.com/openai/codex/archive/HEAD.zip"
    );
  });

  it("accepts direct ZIP URLs", () => {
    expect(validateRemoteSource("https://example.com/skill.zip")).toEqual({ ok: true });
    expect(detectSourceType("https://example.com/skill.zip")).toBe("remoteZip");
  });

  it("rejects unsupported URLs", () => {
    const validation = validateRemoteSource("https://example.com/skill");
    expect(validation.ok).toBe(false);
    if (!validation.ok) {
      expect(validation.error).toContain(".zip");
    }
  });
});
