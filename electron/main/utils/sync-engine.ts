import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import { collectManagedFiles } from "./directory-diff";

export async function computeDirectoryHash(rootPath: string) {
  if (!fs.existsSync(rootPath)) {
    return null;
  }

  const hasher = createHash("sha256");
  const files = await collectManagedFiles(rootPath);

  for (const relativePath of files) {
    const absolutePath = path.join(rootPath, ...relativePath.split("/"));
    hasher.update(relativePath);
    hasher.update("\0");
    hasher.update(await fsp.readFile(absolutePath));
    hasher.update("\0");
  }

  return hasher.digest("hex");
}

export async function replaceDirectory(sourcePath: string, targetPath: string) {
  const targetParent = path.dirname(targetPath);
  const targetName = path.basename(targetPath);
  const operationId = randomUUID();
  const stagedPath = path.join(targetParent, `.${targetName}.staging-${operationId}`);
  const backupPath = path.join(targetParent, `.${targetName}.backup-${operationId}`);
  let movedExistingTarget = false;

  await fsp.mkdir(targetParent, { recursive: true });

  try {
    await fsp.cp(sourcePath, stagedPath, {
      recursive: true,
      force: false
    });

    if (fs.existsSync(targetPath)) {
      await fsp.rename(targetPath, backupPath);
      movedExistingTarget = true;
    }

    await fsp.rename(stagedPath, targetPath);

    if (movedExistingTarget) {
      await fsp.rm(backupPath, { recursive: true, force: true });
    }
  } catch (error) {
    await fsp.rm(stagedPath, { recursive: true, force: true });

    if (movedExistingTarget && !fs.existsSync(targetPath) && fs.existsSync(backupPath)) {
      await fsp.rename(backupPath, targetPath);
    }

    throw error;
  }
}
