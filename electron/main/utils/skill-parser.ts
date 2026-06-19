import fs from "node:fs/promises";
import path from "node:path";

export interface ParsedSkillMetadata {
  name: string;
  description: string | null;
  slug: string;
  markdown: string;
  rootPath: string;
  skillMdPath: string;
}

function stripInlineMarkdown(value: string) {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .trim();
}

export function slugifySkillName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function extractSkillMetadata(markdown: string, fallbackName: string) {
  const lines = markdown.split(/\r?\n/).map((line) => line.trim());
  const titleLine = lines.find((line) => line.startsWith("# "));
  const name = stripInlineMarkdown(titleLine?.replace(/^#\s+/, "") || fallbackName) || fallbackName;

  const descriptionLine = lines.find((line) => {
    if (!line) {
      return false;
    }

    if (line.startsWith("#") || line.startsWith("```")) {
      return false;
    }

    return true;
  });

  const description = descriptionLine ? stripInlineMarkdown(descriptionLine) : null;

  return {
    name,
    description,
    slug: slugifySkillName(name || fallbackName || "skill")
  };
}

export async function detectSkillDirectory(searchRoot: string): Promise<ParsedSkillMetadata> {
  const rootSkillMdPath = path.join(searchRoot, "SKILL.md");

  if (await exists(rootSkillMdPath)) {
    const markdown = await fs.readFile(rootSkillMdPath, "utf8");
    const metadata = extractSkillMetadata(markdown, path.basename(searchRoot));

    return {
      ...metadata,
      markdown,
      rootPath: searchRoot,
      skillMdPath: rootSkillMdPath
    };
  }

  const childEntries = await fs.readdir(searchRoot, { withFileTypes: true });
  const matchedDirectories: string[] = [];

  for (const entry of childEntries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const skillMdPath = path.join(searchRoot, entry.name, "SKILL.md");
    if (await exists(skillMdPath)) {
      matchedDirectories.push(path.join(searchRoot, entry.name));
    }
  }

  if (matchedDirectories.length === 0) {
    throw new Error("未在压缩包根目录或单层子目录中找到 SKILL.md。");
  }

  if (matchedDirectories.length > 1) {
    throw new Error("检测到多个可能的 Skill 根目录，当前 MVP 无法自动判定。");
  }

  const rootPath = matchedDirectories[0];
  const skillMdPath = path.join(rootPath, "SKILL.md");
  const markdown = await fs.readFile(skillMdPath, "utf8");
  const metadata = extractSkillMetadata(markdown, path.basename(rootPath));

  return {
    ...metadata,
    markdown,
    rootPath,
    skillMdPath
  };
}

async function exists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
