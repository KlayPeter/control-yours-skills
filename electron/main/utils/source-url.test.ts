import { describe, expect, it } from "vitest";

import {
  detectSourceType,
  isGitHubRepoUrl,
  normalizeGitHubRepositoryUrl,
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

  it("normalizes trusted GitHub repository URLs", () => {
    expect(normalizeGitHubRepositoryUrl("https://github.com/openai/codex.git/tree/main")).toBe(
      "https://github.com/openai/codex"
    );
    expect(() => normalizeGitHubRepositoryUrl("http://github.com/openai/codex")).toThrow(
      "public HTTPS GitHub repository"
    );
  });

  it("accepts direct ZIP URLs", () => {
    expect(validateRemoteSource("https://example.com/skill.zip")).toEqual({ ok: true });
    expect(detectSourceType("https://example.com/skill.zip")).toBe("remoteZip");
  });

  it("rejects insecure URLs and embedded credentials", () => {
    expect(validateRemoteSource("http://example.com/skill.zip")).toEqual({
      ok: false,
      error: "Only HTTPS remote URLs are supported."
    });
    expect(validateRemoteSource("https://user:secret@example.com/skill.zip")).toEqual({
      ok: false,
      error: "Remote source URLs cannot include credentials."
    });
  });

  it("rejects unsupported URLs", () => {
    const validation = validateRemoteSource("https://example.com/skill");
    expect(validation.ok).toBe(false);
    if (!validation.ok) {
      expect(validation.error).toContain(".zip");
    }
  });
});
