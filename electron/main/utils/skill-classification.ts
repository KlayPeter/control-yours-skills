import path from "node:path";

export interface SkillClassificationInput {
  name: string | null;
  description: string | null;
  sourceValue: string;
  skillRootPath?: string | null;
  markdown?: string | null;
  readmeExcerpt?: string | null;
}

export interface SkillClassificationResult {
  suggestedCategory: string | null;
  classificationReason: string | null;
  classificationConfidence: number | null;
}

interface CategoryRule {
  category: string;
  keywords: string[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: "programming",
    keywords: [
      "api",
      "backend",
      "code",
      "coding",
      "debug",
      "developer",
      "development",
      "frontend",
      "github",
      "javascript",
      "programming",
      "pr review",
      "pull request",
      "python",
      "refactor",
      "repo",
      "repository",
      "review",
      "test",
      "typescript"
    ]
  },
  {
    category: "image",
    keywords: [
      "background removal",
      "crop",
      "image",
      "images",
      "illustration",
      "img",
      "jpeg",
      "jpg",
      "logo",
      "photo",
      "picture",
      "png",
      "remove background",
      "resize",
      "screenshot",
      "watermark"
    ]
  },
  {
    category: "video",
    keywords: ["captions", "clip", "editing", "frame", "movie", "shorts", "subtitle", "timeline", "video", "videos"]
  },
  {
    category: "writing",
    keywords: ["article", "blog", "content", "copywriting", "draft", "newsletter", "story", "writer", "writing", "写作", "公众号"]
  },
  {
    category: "office",
    keywords: ["doc", "document", "excel", "meeting", "minutes", "office", "ppt", "presentation", "report", "sheet", "slides", "spreadsheet"]
  },
  {
    category: "automation",
    keywords: ["agent", "automate", "automation", "bot", "cron", "deploy", "integration", "pipeline", "schedule", "sync", "workflow"]
  },
  {
    category: "research",
    keywords: ["analysis", "analyze", "benchmark", "insight", "investigate", "research", "search", "study", "summarize", "summary"]
  }
];

function normalizeText(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .replace(/[_/\\.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeMarkdownExcerpt(markdown: string | null | undefined) {
  if (!markdown) {
    return "";
  }

  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/[#>*-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2000);
}

function scoreKeyword(text: string, keyword: string) {
  if (!text || !keyword) {
    return 0;
  }

  if (keyword.includes(" ")) {
    return text.includes(keyword) ? 1 : 0;
  }

  const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
  return (text.match(pattern) || []).length;
}

function scoreCategory(rule: CategoryRule, fields: Record<string, { text: string; weight: number }>) {
  let score = 0;
  const matches = new Set<string>();

  for (const keyword of rule.keywords) {
    for (const { text, weight } of Object.values(fields)) {
      const hits = scoreKeyword(text, keyword);
      if (hits > 0) {
        score += hits * weight;
        matches.add(keyword);
      }
    }
  }

  return {
    score,
    matches: Array.from(matches).slice(0, 4)
  };
}

export function classifySkill(input: SkillClassificationInput): SkillClassificationResult {
  const fields = {
    name: {
      text: normalizeText(input.name),
      weight: 5
    },
    description: {
      text: normalizeText(input.description),
      weight: 3
    },
    path: {
      text: normalizeText(
        [input.sourceValue, input.skillRootPath, path.basename(input.skillRootPath || input.sourceValue || "")]
          .filter(Boolean)
          .join(" ")
      ),
      weight: 2
    },
    content: {
      text: normalizeMarkdownExcerpt([input.markdown, input.readmeExcerpt].filter(Boolean).join("\n")),
      weight: 1
    }
  };

  const ranked = CATEGORY_RULES
    .map((rule) => ({
      category: rule.category,
      ...scoreCategory(rule, fields)
    }))
    .sort((left, right) => right.score - left.score || left.category.localeCompare(right.category));

  const best = ranked[0];
  if (!best || best.score < 2) {
    return {
      suggestedCategory: null,
      classificationReason: null,
      classificationConfidence: null
    };
  }

  const confidence = Math.min(0.96, 0.45 + best.score / 20);

  return {
    suggestedCategory: best.category,
    classificationReason:
      best.matches.length > 0
        ? `Matched ${best.category} keywords: ${best.matches.join(", ")}.`
        : `Matched ${best.category} patterns from the skill metadata.`,
    classificationConfidence: Number(confidence.toFixed(2))
  };
}
