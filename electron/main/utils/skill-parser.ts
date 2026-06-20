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

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".github",
  ".next",
  ".venv",
  "__tests__",
  "build",
  "coverage",
  "dist",
  "dist-electron",
  "docs",
  "example",
  "examples",
  "node_modules",
  "test",
  "tests"
]);
const MAX_SKILL_SCAN_DEPTH = 6;

function stripInlineMarkdown(value: string) {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/^>\s*/gm, "")
    .trim();
}

function extractFrontmatter(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") {
    return { attributes: {}, content: markdown };
  }

  const attributes: Record<string, string> = {};
  let endIndex = -1;

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (line === "---") {
      endIndex = index;
      break;
    }

    const separatorIndex = line.indexOf(":");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && value) {
      attributes[key] = value;
    }
  }

  if (endIndex === -1) {
    return { attributes: {}, content: markdown };
  }

  return {
    attributes,
    content: lines.slice(endIndex + 1).join("\n")
  };
}

function extractDescription(markdownBody: string) {
  const lines = markdownBody.split(/\r?\n/);
  const paragraphLines: string[] = [];
  let inCodeFence = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith("```")) {
      inCodeFence = !inCodeFence;
      if (!inCodeFence && paragraphLines.length > 0) {
        break;
      }
      continue;
    }

    if (inCodeFence) {
      continue;
    }

    if (!line) {
      if (paragraphLines.length > 0) {
        break;
      }
      continue;
    }

    if (
      line.startsWith("#") ||
      line.startsWith("![") ||
      line.startsWith("|") ||
      /^[-*_]{3,}$/.test(line) ||
      /^[-*+]\s/.test(line) ||
      /^\d+\.\s/.test(line)
    ) {
      if (paragraphLines.length > 0) {
        break;
      }
      continue;
    }

    paragraphLines.push(line);
  }

  if (paragraphLines.length === 0) {
    return null;
  }

  return stripInlineMarkdown(paragraphLines.join(" "));
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
  const { attributes, content } = extractFrontmatter(markdown);
  const lines = content.split(/\r?\n/).map((line) => line.trim());
  const titleLine = lines.find((line) => line.startsWith("# "));
  const frontmatterName = attributes.title || attributes.name;
  const frontmatterDescription = attributes.description;
  const name =
    stripInlineMarkdown(titleLine?.replace(/^#\s+/, "") || frontmatterName || fallbackName) ||
    fallbackName;
  const description =
    stripInlineMarkdown(frontmatterDescription || "") || extractDescription(content) || null;

  return {
    name,
    description,
    slug: slugifySkillName(name || fallbackName || "skill")
  };
}

export async function detectSkillDirectory(searchRoot: string): Promise<ParsedSkillMetadata> {
  const matchedDirectories = await findSkillDirectories(searchRoot, 0);

  if (matchedDirectories.length === 0) {
    throw new Error("No SKILL.md file was found in the imported source.");
  }

  const rootPath = selectBestSkillDirectory(searchRoot, matchedDirectories);
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

async function findSkillDirectories(searchRoot: string, depth: number): Promise<string[]> {
  const discovered: string[] = [];
  const skillMdPath = path.join(searchRoot, "SKILL.md");

  if (await exists(skillMdPath)) {
    discovered.push(searchRoot);
  }

  if (depth >= MAX_SKILL_SCAN_DEPTH) {
    return discovered;
  }

  const childEntries = await fs.readdir(searchRoot, { withFileTypes: true });
  for (const entry of childEntries) {
    if (!entry.isDirectory() || IGNORED_DIRECTORIES.has(entry.name.toLowerCase())) {
      continue;
    }

    const nestedPath = path.join(searchRoot, entry.name);
    const nestedMatches = await findSkillDirectories(nestedPath, depth + 1);
    discovered.push(...nestedMatches);
  }

  return discovered;
}

function selectBestSkillDirectory(searchRoot: string, candidates: string[]) {
  const ranked = candidates
    .map((candidate) => ({
      candidate,
      score: scoreSkillDirectory(searchRoot, candidate)
    }))
    .sort((left, right) => right.score - left.score || left.candidate.localeCompare(right.candidate));

  const best = ranked[0];
  const second = ranked[1];

  if (best && second && best.score === second.score) {
    const listedCandidates = ranked
      .slice(0, 5)
      .map((entry) => normalizeRelativePath(path.relative(searchRoot, entry.candidate) || "."))
      .join(", ");
    throw new Error(`Multiple SKILL.md candidates were found: ${listedCandidates}`);
  }

  return best.candidate;
}

function scoreSkillDirectory(searchRoot: string, candidate: string) {
  const relativePath = normalizeRelativePath(path.relative(searchRoot, candidate) || ".");
  const segments = relativePath === "." ? [] : relativePath.split("/");
  const depth = segments.length;
  const rootName = path.basename(searchRoot).toLowerCase();
  const candidateName = path.basename(candidate).toLowerCase();
  let score = 100 - depth * 5;

  if (depth === 0) {
    score += 120;
  }

  if (segments[0] === "skills") {
    score += 80;
  }

  if (segments.length === 2 && segments[0] === "skills") {
    score += 60;
  }

  if (candidateName === rootName) {
    score += 25;
  }

  if (segments.includes("archive") || segments.includes("src")) {
    score -= 5;
  }

  return score;
}

function normalizeRelativePath(relativePath: string) {
  return relativePath.split(path.sep).join("/");
}

async function exists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
