import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type {
  WorkspaceSkillEntry,
  WorkspaceSkillProviderKey,
  WorkspaceSkillSource,
  WorkspaceSkillSourceScope,
  WorkspaceTreeNode
} from "@shared/contracts";

import { extractSkillMetadata } from "./skill-parser";

const PROVIDERS: Array<{
  key: WorkspaceSkillProviderKey;
  label: string;
  directoryName: string;
}> = [
  { key: "codex", label: "Codex", directoryName: ".codex" },
  { key: "claude", label: "Claude", directoryName: ".claude" },
  { key: "agents", label: "Agents", directoryName: ".agents" }
];

const IGNORED_DIRECTORIES = new Set(["node_modules", ".git", ".next", "dist-electron", "dist"]);
const MAX_SCAN_DEPTH = 4;
const MAX_PROJECT_TREE_DEPTH = 6;

export async function scanWorkspaceSkillSources(workspaceRoot: string): Promise<WorkspaceSkillSource[]> {
  return scanSkillSources("project", workspaceRoot);
}

export async function scanSystemSkillSources(): Promise<WorkspaceSkillSource[]> {
  return scanSkillSources("system", os.homedir());
}

export async function scanProjectTree(projectRoot: string, includeEmptyFolders = false): Promise<WorkspaceTreeNode[]> {
  return scanProjectTreeDirectory(projectRoot, projectRoot, 0, includeEmptyFolders);
}

function scanSkillSources(scope: WorkspaceSkillSourceScope, rootPath: string): Promise<WorkspaceSkillSource[]> {
  return Promise.all(
    PROVIDERS.map(async (provider) => {
      const providerPath = path.join(rootPath, provider.directoryName);
      const skillsRoot = path.join(providerPath, "skills");
      const exists = await isDirectory(skillsRoot);
      const skills = exists ? await collectSkills(skillsRoot, skillsRoot, 0) : [];

      skills.sort((left, right) => left.relativePath.localeCompare(right.relativePath));

      return {
        id: `${scope}:${provider.key}`,
        key: provider.key,
        scope,
        label: provider.label,
        directoryName: provider.directoryName,
        path: skillsRoot,
        exists,
        skillCount: skills.length,
        skills,
        tree: buildWorkspaceTree(skillsRoot, skills)
      } satisfies WorkspaceSkillSource;
    })
  );
}

export function resolveSystemProviderSkillPath(providerKey: WorkspaceSkillProviderKey, homeDir: string) {
  const provider = PROVIDERS.find((entry) => entry.key === providerKey);
  if (!provider) {
    return null;
  }

  return path.join(homeDir, provider.directoryName, "skills");
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

function buildWorkspaceTree(providerRoot: string, skills: WorkspaceSkillEntry[]): WorkspaceTreeNode[] {
  const root: WorkspaceTreeNode[] = [];

  for (const skill of skills) {
    const normalizedRelativePath = normalizeRelativePath(path.relative(providerRoot, skill.rootPath) || ".");
    const segments = normalizedRelativePath === "." ? [] : normalizedRelativePath.split("/");
    insertSkillNode(root, skill, segments, providerRoot, ".");
  }

  return sortTreeNodes(root);
}

async function scanProjectTreeDirectory(
  projectRoot: string,
  currentPath: string,
  depth: number,
  includeEmptyFolders: boolean
): Promise<WorkspaceTreeNode[]> {
  if (depth > MAX_PROJECT_TREE_DEPTH) {
    return [];
  }

  const entries = await fs.readdir(currentPath, { withFileTypes: true });
  const nodes: WorkspaceTreeNode[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || IGNORED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const absolutePath = path.join(currentPath, entry.name);
    const relativePath = normalizeRelativePath(path.relative(projectRoot, absolutePath) || ".");
    const skillMdPath = path.join(absolutePath, "SKILL.md");

    if (await isFile(skillMdPath)) {
      const markdown = await fs.readFile(skillMdPath, "utf8");
      const metadata = extractSkillMetadata(markdown, entry.name);
      const skill: WorkspaceSkillEntry = {
        id: `${relativePath}:${skillMdPath}`,
        name: metadata.name,
        description: metadata.description,
        relativePath,
        rootPath: absolutePath,
        skillMdPath
      };

      nodes.push({
        id: `skill:${skillMdPath}`,
        kind: "skill",
        name: metadata.name,
        relativePath,
        absolutePath,
        description: metadata.description,
        children: [],
        skill
      });
      continue;
    }

    const children = await scanProjectTreeDirectory(projectRoot, absolutePath, depth + 1, includeEmptyFolders);
    if (children.length > 0 || includeEmptyFolders) {
      nodes.push({
        id: `folder:${absolutePath}`,
        kind: "folder",
        name: entry.name,
        relativePath,
        absolutePath,
        description: null,
        children
      });
    }
  }

  return sortTreeNodes(nodes);
}

function insertSkillNode(
  nodes: WorkspaceTreeNode[],
  skill: WorkspaceSkillEntry,
  segments: string[],
  parentAbsolutePath: string,
  parentRelativePath: string
) {
  if (segments.length === 0) {
    nodes.push({
      id: `skill:${skill.skillMdPath}`,
      kind: "skill",
      name: skill.name,
      relativePath: ".",
      absolutePath: skill.rootPath,
      description: skill.description,
      children: [],
      skill
    });
    return;
  }

  const [segment, ...rest] = segments;
  const absolutePath = path.join(parentAbsolutePath, segment);
  const relativePath = parentRelativePath === "." ? segment : `${parentRelativePath}/${segment}`;

  if (rest.length === 0) {
    nodes.push({
      id: `skill:${skill.skillMdPath}`,
      kind: "skill",
      name: skill.name,
      relativePath,
      absolutePath: skill.rootPath,
      description: skill.description,
      children: [],
      skill
    });
    return;
  }

  let folderNode = nodes.find((node) => node.kind === "folder" && node.absolutePath === absolutePath);
  if (!folderNode) {
    folderNode = {
      id: `folder:${absolutePath}`,
      kind: "folder",
      name: segment,
      relativePath,
      absolutePath,
      description: null,
      children: []
    };
    nodes.push(folderNode);
  }

  insertSkillNode(folderNode.children, skill, rest, absolutePath, relativePath);
}

function sortTreeNodes(nodes: WorkspaceTreeNode[]): WorkspaceTreeNode[] {
  return nodes
    .map((node) => ({
      ...node,
      children: sortTreeNodes(node.children)
    }))
    .sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === "folder" ? -1 : 1;
      }

      return left.name.localeCompare(right.name);
    });
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
