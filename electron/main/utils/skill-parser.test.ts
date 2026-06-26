import fs from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { detectSkillDirectory, discoverSkillDirectories, extractSkillMetadata, slugifySkillName } from "./skill-parser";

const createdDirectories: string[] = [];

async function createTempDirectory() {
  const tempRoot = path.join(process.cwd(), ".tmp-tests");
  await fs.mkdir(tempRoot, { recursive: true });
  const directory = await fs.mkdtemp(path.join(tempRoot, "skill-parser-test-"));
  createdDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    createdDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true }))
  );
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

  it("uses frontmatter description when available", () => {
    const metadata = extractSkillMetadata(
      "---\nname: Frontmatter Skill\ndescription: Frontmatter summary\n---\n\n# Skill Alpha",
      "fallback"
    );

    expect(metadata.name).toBe("Skill Alpha");
    expect(metadata.description).toBe("Frontmatter summary");
  });

  it("skips headings and bullet lists when finding a description", () => {
    const metadata = extractSkillMetadata(
      "# Skill Alpha\n\n- bullet one\n- bullet two\n\nThis is the first real paragraph.\n\n## More",
      "fallback"
    );

    expect(metadata.description).toBe("This is the first real paragraph.");
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

  it("finds a skill deeper than one directory level", async () => {
    const tempDir = await createTempDirectory();
    const nestedDir = path.join(tempDir, "packages", "skills", "deep-skill");
    await fs.mkdir(nestedDir, { recursive: true });
    await fs.writeFile(path.join(nestedDir, "SKILL.md"), "# Deep Skill\n\nDeep description", "utf8");

    const result = await detectSkillDirectory(tempDir);

    expect(result.name).toBe("Deep Skill");
    expect(result.rootPath).toBe(nestedDir);
  });

  it("prefers skills/<name>/SKILL.md when multiple candidates exist", async () => {
    const tempDir = await createTempDirectory();
    const docsDir = path.join(tempDir, "docs");
    const skillsDir = path.join(tempDir, "skills", "ppt-master");
    await fs.mkdir(docsDir, { recursive: true });
    await fs.mkdir(skillsDir, { recursive: true });
    await fs.writeFile(path.join(docsDir, "SKILL.md"), "# Docs Skill", "utf8");
    await fs.writeFile(path.join(skillsDir, "SKILL.md"), "# Real Skill\n\nActual description", "utf8");

    const result = await detectSkillDirectory(tempDir);

    expect(result.name).toBe("Real Skill");
    expect(result.rootPath).toBe(skillsDir);
  });

  it("rejects archives with ambiguous candidate skill roots", async () => {
    const tempDir = await createTempDirectory();
    const firstDir = path.join(tempDir, "skill-a");
    const secondDir = path.join(tempDir, "skill-b");
    await fs.mkdir(firstDir, { recursive: true });
    await fs.mkdir(secondDir, { recursive: true });
    await fs.writeFile(path.join(firstDir, "SKILL.md"), "# Skill A", "utf8");
    await fs.writeFile(path.join(secondDir, "SKILL.md"), "# Skill B", "utf8");

    await expect(detectSkillDirectory(tempDir)).rejects.toThrow("Multiple SKILL.md candidates were found");
  });
});

describe("discoverSkillDirectories", () => {
  it("discovers multiple top-level skills in one folder", async () => {
    const tempDir = await createTempDirectory();
    const firstDir = path.join(tempDir, "image-cleanup");
    const secondDir = path.join(tempDir, "code-review");
    await fs.mkdir(firstDir, { recursive: true });
    await fs.mkdir(secondDir, { recursive: true });
    await fs.writeFile(path.join(firstDir, "SKILL.md"), "# Image Cleanup\n\nImage helper", "utf8");
    await fs.writeFile(path.join(secondDir, "SKILL.md"), "# Code Review\n\nProgramming helper", "utf8");

    const results = await discoverSkillDirectories(tempDir);

    expect(results).toHaveLength(2);
    expect(results.map((item) => item.name).sort()).toEqual(["Code Review", "Image Cleanup"]);
  });

  it("stops descending when a parent folder is already a skill", async () => {
    const tempDir = await createTempDirectory();
    const parentDir = path.join(tempDir, "skill-bundle");
    const nestedDir = path.join(parentDir, "nested-skill");
    await fs.mkdir(nestedDir, { recursive: true });
    await fs.writeFile(path.join(parentDir, "SKILL.md"), "# Parent Skill\n\nParent description", "utf8");
    await fs.writeFile(path.join(nestedDir, "SKILL.md"), "# Nested Skill\n\nNested description", "utf8");

    const results = await discoverSkillDirectories(tempDir);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Parent Skill");
    expect(results[0].rootPath).toBe(parentDir);
  });
});
