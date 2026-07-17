import { randomUUID } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import { collectManagedFiles } from "./directory-diff";

export async function createDirectorySnapshot(sourcePath: string, snapshotPath: string) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error("The directory selected for backup no longer exists.");
  }

  const parentPath = path.dirname(snapshotPath);
  const stagedPath = path.join(parentPath, `.snapshot-staging-${randomUUID()}`);
  let sizeBytes = 0;

  await fsp.mkdir(parentPath, { recursive: true });

  try {
    await fsp.mkdir(stagedPath, { recursive: true });
    for (const relativePath of await collectManagedFiles(sourcePath)) {
      const sourceFile = path.join(sourcePath, ...relativePath.split("/"));
      const targetFile = path.join(stagedPath, ...relativePath.split("/"));
      await fsp.mkdir(path.dirname(targetFile), { recursive: true });
      await fsp.copyFile(sourceFile, targetFile);
      sizeBytes += (await fsp.stat(sourceFile)).size;
    }

    await fsp.rename(stagedPath, snapshotPath);
    return { snapshotPath, sizeBytes };
  } catch (error) {
    await fsp.rm(stagedPath, { recursive: true, force: true });
    throw error;
  }
}
