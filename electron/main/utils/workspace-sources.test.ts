import fs from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { scanProjectTree, scanWorkspaceSkillSources } from "./workspace-sources";

const createdDirectories: string[] = [];

async function createTempDirectory() {
  const tempRoot = path.join(process.cwd(), ".tmp-tests");
  await fs.mkdir(tempRoot, { recursive: true });
  const directory = await fs.mkdtemp(path.join(tempRoot, "workspace-sources-test-"));
  createdDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    createdDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true }))
  );
});

describe("scanWorkspaceSkillSources", () => {
  it("detects supported provider skill directories only", async () => {
    const workspaceRoot = await createTempDirectory();
    const codexSkillRoot = path.join(workspaceRoot, ".codex", "skills", "alpha");
    const agentsSkillRoot = path.join(workspaceRoot, ".agents", "skills", "nested", "beta");
    const legacyAgentRoot = path.join(workspaceRoot, ".agent", "skills", "legacy");

    await fs.mkdir(codexSkillRoot, { recursive: true });
    await fs.mkdir(agentsSkillRoot, { recursive: true });
    await fs.mkdir(legacyAgentRoot, { recursive: true });
    await fs.writeFile(path.join(codexSkillRoot, "SKILL.md"), "# Alpha\n\nCodex skill", "utf8");
    await fs.writeFile(path.join(agentsSkillRoot, "SKILL.md"), "# Beta\n\nAgents skill", "utf8");
    await fs.writeFile(path.join(legacyAgentRoot, "SKILL.md"), "# Legacy\n\nUnsupported source", "utf8");

    const sources = await scanWorkspaceSkillSources(workspaceRoot);
    const codex = sources.find((source) => source.key === "codex");
    const claude = sources.find((source) => source.key === "claude");
    const agents = sources.find((source) => source.key === "agents");

    expect(codex?.exists).toBe(true);
    expect(codex?.skills).toHaveLength(1);
    expect(codex?.skills[0]?.name).toBe("Alpha");
    expect(claude?.exists).toBe(false);
    expect(agents?.skills.map((skill) => skill.relativePath)).toEqual(["nested/beta"]);
    expect(sources.flatMap((source) => source.skills).some((skill) => skill.name === "Legacy")).toBe(false);
  });
});

describe("scanProjectTree", () => {
  it("returns only project branches that contain skills", async () => {
    const projectRoot = await createTempDirectory();
    const skillRoot = path.join(projectRoot, "packages", "skill-alpha");
    const emptyDocsRoot = path.join(projectRoot, "docs");
    const ignoredSkillRoot = path.join(projectRoot, "node_modules", "ignored-skill");

    await fs.mkdir(skillRoot, { recursive: true });
    await fs.mkdir(emptyDocsRoot, { recursive: true });
    await fs.mkdir(ignoredSkillRoot, { recursive: true });
    await fs.writeFile(path.join(skillRoot, "SKILL.md"), "# Project Alpha\n\nProject skill", "utf8");
    await fs.writeFile(path.join(ignoredSkillRoot, "SKILL.md"), "# Ignored\n\nIgnored skill", "utf8");

    const tree = await scanProjectTree(projectRoot);

    expect(tree.map((node) => node.name)).toEqual(["packages"]);
    expect(tree[0]?.children.map((node) => node.name)).toEqual(["Project Alpha"]);
    expect(tree[0]?.children[0]?.kind).toBe("skill");
    expect(tree[0]?.children[0]?.relativePath).toBe("packages/skill-alpha");
  });
});
