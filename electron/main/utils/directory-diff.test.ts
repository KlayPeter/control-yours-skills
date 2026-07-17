import fs from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { collectManagedFiles, diffDirectories } from "./directory-diff";

const createdDirectories: string[] = [];

async function createFixture() {
  const tempRoot = path.join(process.cwd(), ".tmp-tests");
  await fs.mkdir(tempRoot, { recursive: true });
  const root = await fs.mkdtemp(path.join(tempRoot, "directory-diff-test-"));
  createdDirectories.push(root);
  const before = path.join(root, "before");
  const after = path.join(root, "after");
  await Promise.all([fs.mkdir(before), fs.mkdir(after)]);
  return { before, after };
}

afterEach(async () => {
  await Promise.all(
    createdDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true }))
  );
});

describe("diffDirectories", () => {
  it("reports added, modified and deleted text files with patches", async () => {
    const { before, after } = await createFixture();
    await Promise.all([
      fs.writeFile(path.join(before, "modified.md"), "old\n"),
      fs.writeFile(path.join(after, "modified.md"), "new\n"),
      fs.writeFile(path.join(before, "deleted.txt"), "removed\n"),
      fs.writeFile(path.join(after, "added.txt"), "added\n")
    ]);

    const result = await diffDirectories(before, after);

    expect(result.summary).toEqual({ added: 1, modified: 1, deleted: 1, unchanged: 0 });
    expect(result.entries.map((entry) => [entry.path, entry.change])).toEqual([
      ["added.txt", "added"],
      ["deleted.txt", "deleted"],
      ["modified.md", "modified"]
    ]);
    expect(result.entries.every((entry) => entry.patch?.includes(entry.path))).toBe(true);
  });

  it("marks binary changes without exposing their contents", async () => {
    const { before, after } = await createFixture();
    await fs.writeFile(path.join(after, "image.bin"), Buffer.from([0, 1, 2, 3]));

    const result = await diffDirectories(before, after);

    expect(result.entries[0]).toMatchObject({ path: "image.bin", kind: "binary", patch: null });
  });

  it("ignores dependency, repository and cache directories", async () => {
    const { before } = await createFixture();
    for (const directory of [".git", ".next", "node_modules", "__pycache__"]) {
      const target = path.join(before, directory);
      await fs.mkdir(target);
      await fs.writeFile(path.join(target, "ignored.txt"), directory);
    }
    await fs.writeFile(path.join(before, "SKILL.md"), "# Skill\n");

    await expect(collectManagedFiles(before)).resolves.toEqual(["SKILL.md"]);
  });
});
