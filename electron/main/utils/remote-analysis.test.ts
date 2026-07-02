import { describe, expect, it } from "vitest";

import type { EnvironmentInfo } from "@shared/contracts";

import { analyzeRemoteReadmeWithRules } from "./remote-analysis";

const macEnvironment: EnvironmentInfo = {
  os: "darwin",
  arch: "arm64",
  shell: "/bin/zsh",
  tools: [
    { name: "git", available: true, command: "/usr/bin/git" },
    { name: "node", available: false, command: null },
    { name: "npm", available: false, command: null },
    { name: "npx", available: false, command: null }
  ]
};

describe("analyzeRemoteReadmeWithRules", () => {
  it("builds a guided install strategy from README commands and path hints", () => {
    const readme = `
# AI News Radar

## Install
1. Clone this repository to your machine.
2. Run \`npx skills add LearnPrompt/ai-news-radar -s ai-radar -g\`
3. Copy the skill folder into ~/.codex/skills after the command finishes.
`;

    const strategy = analyzeRemoteReadmeWithRules("githubRepo", readme, macEnvironment);

    expect(strategy.type).toBe("command");
    expect(strategy.command).toContain("npx skills add LearnPrompt/ai-news-radar -s ai-radar -g");
    expect(strategy.workingDirectory).toBe("仓库根目录");
    expect(strategy.prerequisiteSteps.some((step) => step.includes("Node.js"))).toBe(true);
    expect(strategy.manualSteps.some((step) => step.includes("~/.codex/skills"))).toBe(true);
  });

  it("falls back to a cautious manual guide when README is missing", () => {
    const strategy = analyzeRemoteReadmeWithRules("githubRepo", null, macEnvironment);

    expect(strategy.type).toBe("manual");
    expect(strategy.command).toBeNull();
    expect(strategy.manualSteps.some((step) => step.includes("手动阅读安装章节"))).toBe(true);
    expect(strategy.manualSteps.some((step) => step.includes("~/.codex/skills"))).toBe(true);
  });
});
