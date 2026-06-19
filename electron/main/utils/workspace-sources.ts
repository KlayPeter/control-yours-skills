import fs from "node:fs/promises";
import path from "node:path";

import type { WorkspaceSkillEntry, WorkspaceSkillProviderKey, WorkspaceSkillSource } from "@shared/contracts";

import { extractSkillMetadata } from "./skill-parser";

const PROVIDERS: Array<{
  key: WorkspaceSkillProviderKey;
  label: string;
  directoryName: string;
}> = [
  { key: "codex", label: "Codex", directoryName: ".codex" },
  { key: "claude", label: "Claude", directoryName: ".claude" },
  { key: "agent", label: "Agent", directoryName: ".agent" },
  { key: "agents", label: "Agents", directoryName: ".agents" }
];

const IGNORED_DIRECTORIES = new Set(["node_modules", ".git", ".next", "dist-electron", "dist"]);
const MAX_SCAN_DEPTH = 4;

export async function scanWorkspaceSkillSources(workspaceRoot: string): Promise<WorkspaceSkillSource[]> {
  const sources = await Promise.all(
    PROVIDERS.map(async (provider) => {
      const providerPath = path.join(workspaceRoot, provider.directoryName);
      const exists = await isDirectory(providerPath);
      const skills = exists ? await collectSkills(providerPath, providerPath, 0) : [];

      skills.sort((left, right) => left.relativePath.localeCompare(right.relativePath));

      return {
        key: provider.key,
        label: provider.label,
        directoryName: provider.directoryName,
        path: providerPath,
        exists,
        skillCount: skills.length,
        skills
      } satisfies WorkspaceSkillSource;
    })
  );

  return sources;
}

async function collectSkills(
  providerRoot: string,
  currentPath: string,
  depth: number
): Promise<WorkspaceSkillEntry[]> {
  const discovered = new Map<string, WorkspaceSkillEntry>();
  const skillMdPath = path.join(currentPath, "SKILL.md");

  if (await isFile(skillMdPath)) {
    const markdown = await fs.readFile(skillMdPath, "utf8");
    const metadata = extractSkillMetadata(markdown, path.basename(currentPath));
    const relativePath = normalizeRelativePath(path.relative(providerRoot, currentPath) || ".");

    discovered.set(skillMdPath, {
      id: `${relativePath}:${skillMdPath}`,
      name: metadata.name,
      description: metadata.description,
      relativePath,
      rootPath: currentPath,
      skillMdPath
    });
  }

  if (depth >= MAX_SCAN_DEPTH) {
    return [...discovered.values()];
  }

  const entries = await fs.readdir(currentPath, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || IGNORED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const nestedPath = path.join(currentPath, entry.name);
    const nestedSkills = await collectSkills(providerRoot, nestedPath, depth + 1);
    for (const skill of nestedSkills) {
      discovered.set(skill.skillMdPath, skill);
    }
  }

  return [...discovered.values()];
}

function normalizeRelativePath(relativePath: string) {
  return relativePath.split(path.sep).join("/");
}

async function isDirectory(targetPath: string) {
  try {
    const stats = await fs.stat(targetPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function isFile(targetPath: string) {
  try {
    const stats = await fs.stat(targetPath);
    return stats.isFile();
  } catch {
    return false;
  }
}
