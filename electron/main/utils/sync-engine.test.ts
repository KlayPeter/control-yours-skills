import fs from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { computeDirectoryHash, replaceDirectory } from "./sync-engine";

const createdDirectories: string[] = [];

async function createTempDirectory() {
  const tempRoot = path.join(process.cwd(), ".tmp-tests");
  await fs.mkdir(tempRoot, { recursive: true });
  const directory = await fs.mkdtemp(path.join(tempRoot, "sync-engine-test-"));
  createdDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    createdDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true }))
  );
});

describe("computeDirectoryHash", () => {
  it("returns the same hash for the same directory contents", async () => {
    const directory = await createTempDirectory();
    await fs.mkdir(path.join(directory, "nested"), { recursive: true });
    await fs.writeFile(path.join(directory, "SKILL.md"), "# Demo", "utf8");
    await fs.writeFile(path.join(directory, "nested", "meta.txt"), "hello", "utf8");

    const firstHash = await computeDirectoryHash(directory);
    const secondHash = await computeDirectoryHash(directory);

    expect(firstHash).toBeTruthy();
    expect(firstHash).toBe(secondHash);
  });
});

describe("replaceDirectory", () => {
  it("replaces the target directory with the source contents", async () => {
    const sourceDir = await createTempDirectory();
    const targetParentDir = await createTempDirectory();
    const targetDir = path.join(targetParentDir, "skill-alpha");

    await fs.writeFile(path.join(sourceDir, "SKILL.md"), "# Source", "utf8");
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(path.join(targetDir, "old.txt"), "outdated", "utf8");

    await replaceDirectory(sourceDir, targetDir);

    await expect(fs.readFile(path.join(targetDir, "SKILL.md"), "utf8")).resolves.toContain("Source");
    await expect(fs.access(path.join(targetDir, "old.txt"))).rejects.toThrow();
  });

  it("keeps the existing target when staging the replacement fails", async () => {
    const targetParentDir = await createTempDirectory();
    const targetDir = path.join(targetParentDir, "skill-alpha");
    const missingSourceDir = path.join(targetParentDir, "missing-source");

    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(path.join(targetDir, "SKILL.md"), "# Existing", "utf8");

    await expect(replaceDirectory(missingSourceDir, targetDir)).rejects.toThrow();
    await expect(fs.readFile(path.join(targetDir, "SKILL.md"), "utf8")).resolves.toContain("Existing");
  });
});
