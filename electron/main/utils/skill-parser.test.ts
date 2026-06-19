import fs from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { detectSkillDirectory, extractSkillMetadata, slugifySkillName } from "./skill-parser";

const createdDirectories: string[] = [];

async function createTempDirectory() {
  const tempRoot = path.join(process.cwd(), ".tmp-tests");
  await fs.mkdir(tempRoot, { recursive: true });
  const directory = await fs.mkdtemp(path.join(tempRoot, "skill-parser-test-"));
  createdDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(createdDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

describe("slugifySkillName", () => {
  it("creates stable lowercase slugs", () => {
    expect(slugifySkillName("My Fancy Skill!")).toBe("my-fancy-skill");
  });
});

describe("extractSkillMetadata", () => {
  it("extracts heading and first body line", () => {
    const metadata = extractSkillMetadata("# Skill Alpha\n\nThe first useful description.\n\n## More", "fallback");
    expect(metadata.name).toBe("Skill Alpha");
    expect(metadata.description).toBe("The first useful description.");
    expect(metadata.slug).toBe("skill-alpha");
  });
});

describe("detectSkillDirectory", () => {
  it("detects a skill in the root directory", async () => {
    const tempDir = await createTempDirectory();
    await fs.writeFile(path.join(tempDir, "SKILL.md"), "# Root Skill\n\nRoot description", "utf8");

    const result = await detectSkillDirectory(tempDir);

    expect(result.name).toBe("Root Skill");
    expect(result.description).toBe("Root description");
    expect(result.rootPath).toBe(tempDir);
  });

  it("detects a skill in a single nested directory", async () => {
    const tempDir = await createTempDirectory();
    const nestedDir = path.join(tempDir, "skill-alpha");
    await fs.mkdir(nestedDir, { recursive: true });
    await fs.writeFile(path.join(nestedDir, "SKILL.md"), "# Nested Skill\n\nNested description", "utf8");

    const result = await detectSkillDirectory(tempDir);

    expect(result.name).toBe("Nested Skill");
    expect(result.rootPath).toBe(nestedDir);
  });

  it("rejects archives with multiple candidate skill roots", async () => {
    const tempDir = await createTempDirectory();
    const firstDir = path.join(tempDir, "skill-a");
    const secondDir = path.join(tempDir, "skill-b");
    await fs.mkdir(firstDir, { recursive: true });
    await fs.mkdir(secondDir, { recursive: true });
    await fs.writeFile(path.join(firstDir, "SKILL.md"), "# Skill A", "utf8");
    await fs.writeFile(path.join(secondDir, "SKILL.md"), "# Skill B", "utf8");

    await expect(detectSkillDirectory(tempDir)).rejects.toThrow("多个可能的 Skill 根目录");
  });
});
