import { createHash } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import { createTwoFilesPatch } from "diff";

import type { DirectoryDiffEntry, DirectoryDiffSummary } from "@shared/contracts";

const IGNORED_ENTRIES = new Set([
  ".DS_Store",
  ".git",
  ".next",
  ".pytest_cache",
  ".venv",
  "__pycache__",
  "coverage",
  "node_modules"
]);
const MAX_TEXT_PREVIEW_BYTES = 1024 * 1024;
const MAX_PATCH_LENGTH = 100_000;

export interface DirectoryManifestEntry {
  relativePath: string;
  absolutePath: string;
  hash: string;
  size: number;
}

export async function collectManagedFiles(rootPath: string, currentPath = rootPath): Promise<string[]> {
  if (!fs.existsSync(currentPath)) {
    return [];
  }

  const entries = await fsp.readdir(currentPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (IGNORED_ENTRIES.has(entry.name)) {
      continue;
    }

    const absolutePath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectManagedFiles(rootPath, absolutePath)));
    } else if (entry.isFile()) {
      files.push(path.relative(rootPath, absolutePath).split(path.sep).join("/"));
    }
  }

  return files;
}

export async function buildDirectoryManifest(rootPath: string) {
  const manifest = new Map<string, DirectoryManifestEntry>();

  for (const relativePath of await collectManagedFiles(rootPath)) {
    const absolutePath = path.join(rootPath, ...relativePath.split("/"));
    const content = await fsp.readFile(absolutePath);
    manifest.set(relativePath, {
      relativePath,
      absolutePath,
      hash: createHash("sha256").update(content).digest("hex"),
      size: content.length
    });
  }

  return manifest;
}

function isBinary(content: Buffer) {
  return content.subarray(0, Math.min(content.length, 8_192)).includes(0);
}

async function createTextPatch(
  relativePath: string,
  beforeEntry: DirectoryManifestEntry | undefined,
  afterEntry: DirectoryManifestEntry | undefined
) {
  if ((beforeEntry?.size || 0) > MAX_TEXT_PREVIEW_BYTES || (afterEntry?.size || 0) > MAX_TEXT_PREVIEW_BYTES) {
    return { kind: "text" as const, patch: null, truncated: true };
  }

  const before = beforeEntry ? await fsp.readFile(beforeEntry.absolutePath) : Buffer.alloc(0);
  const after = afterEntry ? await fsp.readFile(afterEntry.absolutePath) : Buffer.alloc(0);
  if (isBinary(before) || isBinary(after)) {
    return { kind: "binary" as const, patch: null, truncated: false };
  }

  const patch = createTwoFilesPatch(
    `before/${relativePath}`,
    `after/${relativePath}`,
    before.toString("utf8"),
    after.toString("utf8"),
    "",
    "",
    { context: 3 }
  );

  return {
    kind: "text" as const,
    patch: patch.length > MAX_PATCH_LENGTH ? patch.slice(0, MAX_PATCH_LENGTH) : patch,
    truncated: patch.length > MAX_PATCH_LENGTH
  };
}

export async function diffDirectories(beforeRoot: string, afterRoot: string) {
  const [beforeManifest, afterManifest] = await Promise.all([
    buildDirectoryManifest(beforeRoot),
    buildDirectoryManifest(afterRoot)
  ]);
  const allPaths = [...new Set([...beforeManifest.keys(), ...afterManifest.keys()])].sort();
  const entries: DirectoryDiffEntry[] = [];

  for (const relativePath of allPaths) {
    const before = beforeManifest.get(relativePath);
    const after = afterManifest.get(relativePath);
    if (before?.hash === after?.hash) {
      continue;
    }

    const change = !before ? "added" : !after ? "deleted" : "modified";
    const preview = await createTextPatch(relativePath, before, after);
    entries.push({
      path: relativePath,
      change,
      kind: preview.kind,
      beforeSize: before?.size || 0,
      afterSize: after?.size || 0,
      patch: preview.patch,
      truncated: preview.truncated
    });
  }

  const summary: DirectoryDiffSummary = {
    added: entries.filter((entry) => entry.change === "added").length,
    modified: entries.filter((entry) => entry.change === "modified").length,
    deleted: entries.filter((entry) => entry.change === "deleted").length,
    unchanged: allPaths.length - entries.length
  };

  return { summary, entries };
}
