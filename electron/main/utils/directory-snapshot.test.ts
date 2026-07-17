import fs from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDirectorySnapshot } from "./directory-snapshot";

const createdDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    createdDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true }))
  );
});

describe("createDirectorySnapshot", () => {
  it("copies managed files and excludes dependency directories", async () => {
    const tempRoot = path.join(process.cwd(), ".tmp-tests");
    await fs.mkdir(tempRoot, { recursive: true });
    const root = await fs.mkdtemp(path.join(tempRoot, "snapshot-test-"));
    createdDirectories.push(root);
    const source = path.join(root, "source");
    const snapshot = path.join(root, "snapshots", "version-1");
    await fs.mkdir(path.join(source, "node_modules"), { recursive: true });
    await fs.writeFile(path.join(source, "SKILL.md"), "# Snapshot\n");
    await fs.writeFile(path.join(source, "node_modules", "ignored.js"), "ignored");

    const result = await createDirectorySnapshot(source, snapshot);

    expect(result.sizeBytes).toBe(Buffer.byteLength("# Snapshot\n"));
    await expect(fs.readFile(path.join(snapshot, "SKILL.md"), "utf8")).resolves.toBe("# Snapshot\n");
    await expect(fs.access(path.join(snapshot, "node_modules", "ignored.js"))).rejects.toThrow();
  });

  it("creates a valid snapshot for an empty directory", async () => {
    const tempRoot = path.join(process.cwd(), ".tmp-tests");
    await fs.mkdir(tempRoot, { recursive: true });
    const root = await fs.mkdtemp(path.join(tempRoot, "snapshot-empty-test-"));
    createdDirectories.push(root);
    const source = path.join(root, "source");
    const snapshot = path.join(root, "snapshots", "version-1");
    await fs.mkdir(source);

    await expect(createDirectorySnapshot(source, snapshot)).resolves.toMatchObject({ sizeBytes: 0 });
    await expect(fs.stat(snapshot)).resolves.toMatchObject({});
  });
});
