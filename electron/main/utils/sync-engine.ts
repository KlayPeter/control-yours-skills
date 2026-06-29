import { createHash } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

const IGNORED_ENTRIES = new Set([".DS_Store"]);

async function collectFiles(rootPath: string, currentPath = rootPath): Promise<string[]> {
  const entries = await fsp.readdir(currentPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (IGNORED_ENTRIES.has(entry.name)) {
      continue;
    }

    const absolutePath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(rootPath, absolutePath)));
      continue;
    }

    if (entry.isFile()) {
      files.push(path.relative(rootPath, absolutePath));
    }
  }

  return files;
}

export async function computeDirectoryHash(rootPath: string) {
  if (!fs.existsSync(rootPath)) {
    return null;
  }

  const hasher = createHash("sha256");
  const files = await collectFiles(rootPath);

  for (const relativePath of files) {
    const absolutePath = path.join(rootPath, relativePath);
    hasher.update(relativePath);
    hasher.update("\0");
    hasher.update(await fsp.readFile(absolutePath));
    hasher.update("\0");
  }

  return hasher.digest("hex");
}

export async function replaceDirectory(sourcePath: string, targetPath: string) {
  await fsp.rm(targetPath, { recursive: true, force: true });
  await fsp.mkdir(path.dirname(targetPath), { recursive: true });
  await fsp.cp(sourcePath, targetPath, {
    recursive: true,
    force: false
  });
}
