import type {
  AiSettings,
  AnalysisMethod,
  EnvironmentInfo,
  InstallStrategy,
  SourceType,
  StagedSourceRecord
} from "@shared/contracts";

import { isGitHubRepoUrl, resolveGitHubArchiveUrl } from "./source-url";

interface RemoteAnalysisInput {
  sourceValue: string;
  sourceType: SourceType;
  ai: AiSettings;
  environment: EnvironmentInfo;
}

export interface RemoteAnalysisResult {
  sourceType: SourceType;
  analysisMethod: AnalysisMethod;
  detectedName: string | null;
  detectedDescription: string | null;
  analysisSummary: string | null;
  archiveUrl: string | null;
  readmeUrl: string | null;
  readmeExcerpt: string | null;
  installStrategy: InstallStrategy;
}

function extractRepoOwnerAndName(sourceValue: string) {
  const url = new URL(sourceValue);
  const [owner, repo] = url.pathname.split("/").filter(Boolean);
  return {
    owner,
    repo: repo?.replace(/\.git$/i, "") || ""
  };
}

function toRawGithubUrl(sourceValue: string, relativePath: string) {
  const { owner, repo } = extractRepoOwnerAndName(sourceValue);
  return `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${relativePath}`;
}

async function fetchText(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "control-your-skills"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      return null;
    }

    return response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeReadmeExcerpt(markdown: string | null) {
  if (!markdown) {
    return null;
  }

  // Preserve empty lines for markdown formatting, just slice the first 25 lines or 1200 chars
  const lines = markdown.split(/\r?\n/).slice(0, 25);
  return lines.join("\n").slice(0, 1200);
}

function unique(items: string[]) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function osLabel(os: string) {
  if (os === "win32") {
    return "Windows";
  }

  if (os === "darwin") {
    return "macOS";
  }

  if (os === "linux") {
    return "Linux";
  }

  return os;
}

function shellLabel(environment: EnvironmentInfo) {
  return environment.os === "win32" ? "PowerShell" : "Terminal";
}

function targetSkillDirectoryLabel(environment: EnvironmentInfo) {
  if (environment.os === "win32") {
    return "~/.codex/skills or %USERPROFILE%\\.codex\\skills";
  }

  return "~/.codex/skills";
}

function normalizeCommandLine(line: string) {
  return line.replace(/^(?:\$|>)+\s*/, "").trim();
}

function commandToToolName(command: string) {
  return command.split(/\s+/)[0]?.toLowerCase() || "";
}

function hasTool(environment: EnvironmentInfo, name: string) {
  return environment.tools.some((entry) => entry.name === name && entry.available);
}

function detectCommandCandidates(readme: string) {
  const lines = readme.split(/\r?\n/).map((line) => line.trim());
  const commands: string[] = [];

  for (const line of lines) {
    const normalized = normalizeCommandLine(line);
    if (/^(npm|npx|pnpm|yarn|uv|pip|python|py|git|curl|tar)\s+/i.test(normalized)) {
      commands.push(normalized);
      continue;
    }

    for (const match of line.matchAll(/`((?:npm|npx|pnpm|yarn|uv|pip|python|py|git|curl|tar)\s+[^`]+)`/gi)) {
      commands.push(normalizeCommandLine(match[1]));
    }

    const embedded = normalized.match(/\b(?:npm|npx|pnpm|yarn|uv|pip|python|py|git|curl|tar)\s+.+$/i);
    if (embedded) {
      commands.push(normalizeCommandLine(embedded[0]));
    }
  }

  return unique(commands);
}

function stripMarkdown(text: string) {
  return text
    .replace(/!\[(.*?)\]\(.*?\)/g, "") // remove images entirely
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // clean links
    .replace(/(\*\*|__)(.*?)\1/g, "$2") // bold
    .replace(/(\*|_)(.*?)\1/g, "$2") // italic
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/~~(.*?)~~/g, "$1") // strikethrough
    .replace(/^#+\s+/g, "") // headings
    .replace(/^-\s+/g, "") // list items
    .trim();
}

function detectManualSteps(readme: string) {
  const lines = readme.split(/\r?\n/).map((line) => line.trim());
  const steps = lines
    .filter((line) =>
      /(^\d+[.)]\s)|(^[-*+]\s)|(copy|move|place|install to|put under|clone|download|extract|open|run|execute|cd\s+|\.codex|\.claude|\.agents|skills|~\/|安装|复制|移动|解压|终端|命令)/i.test(line)
    )
    .map(stripMarkdown)
    .filter((line) => line.length > 5 && !/^(npm|npx|pnpm|yarn|uv|pip|python|py|git|curl|tar)\s+/i.test(line));

  return unique(steps).slice(0, 8);
}

function collectRequiredTools(commands: string[]) {
  return unique(
    commands
      .map((command) => commandToToolName(command))
      .filter(Boolean)
  );
}

function prerequisitesForTool(tool: string, environment: EnvironmentInfo) {
  const targetOs = osLabel(environment.os);

  switch (tool) {
    case "node":
    case "npm":
    case "npx":
      if (hasTool(environment, "node")) {
        return [];
      }

      if (environment.os === "win32") {
        return [
          `Install Node.js LTS on ${targetOs}; npm and npx are bundled with Node.js.`,
          "After installation, reopen PowerShell so node, npm, and npx are available."
        ];
      }

      if (environment.os === "darwin") {
        return [
          `Install Node.js LTS on ${targetOs}; npm and npx are bundled with Node.js.`,
          "Reopen Terminal after the install so node, npm, and npx are on PATH."
        ];
      }

      return [`Install Node.js before running npm or npx commands on ${targetOs}.`];
    case "pnpm":
      if (hasTool(environment, "pnpm")) {
        return [];
      }

      return [
        hasTool(environment, "node")
          ? "Install pnpm globally after Node.js is available, for example with `npm install -g pnpm`."
          : "Install Node.js first, then install pnpm globally with `npm install -g pnpm`."
      ];
    case "yarn":
      if (hasTool(environment, "yarn")) {
        return [];
      }

      return [
        hasTool(environment, "node")
          ? "Install Yarn globally after Node.js is available, for example with `npm install -g yarn`."
          : "Install Node.js first, then install Yarn globally with `npm install -g yarn`."
      ];
    case "python":
    case "py":
    case "pip":
    case "uv":
      if (hasTool(environment, "python") || hasTool(environment, "py") || hasTool(environment, "uv")) {
        return [];
      }

      if (environment.os === "win32") {
        return [
          "Install Python 3 on Windows and enable the PATH option during setup.",
          "After installation, reopen PowerShell so `python`, `py`, and `pip` are available."
        ];
      }

      return ["Install Python 3 before running Python or pip commands."];
    case "git":
      return hasTool(environment, "git") ? [] : [`Install Git before following the repository setup steps on ${targetOs}.`];
    default:
      return hasTool(environment, tool) ? [] : [`Install the required CLI tool \`${tool}\` before running the repository commands.`];
  }
}

function buildPrerequisiteSteps(requiredTools: string[], environment: EnvironmentInfo) {
  return unique(
    requiredTools.flatMap((tool) => prerequisitesForTool(tool, environment))
  );
}

function buildArchiveInstallStrategy(reason: string | null, environment: EnvironmentInfo): InstallStrategy {
  return {
    type: "archiveCopy",
    title: "Metadata only",
    reason,
    command: null,
    workingDirectory: null,
    prerequisiteSteps: [],
    manualSteps: [
      `This remote source is recognized for review only in the current app.`,
      `If you want to try it manually on ${osLabel(environment.os)}, download the archive and inspect its README or SKILL.md before copying files into your skills directory.`
    ],
    requiredTools: [],
    supportedPlatforms: ["win32", "darwin", "linux"],
    canAutoInstall: false
  };
}

function inferWorkingDirectory(commands: string[], manualSteps: string[]) {
  if (manualSteps.some((step) => /(仓库根目录|项目根目录|repo root|project root)/i.test(step))) {
    return "仓库根目录";
  }

  return commands.length > 0 ? "仓库根目录" : null;
}

function buildRuleBasedSteps(sourceType: SourceType, commands: string[], manualSteps: string[], environment: EnvironmentInfo) {
  const steps: string[] = [];

  if (sourceType === "githubRepo") {
    steps.push("先在浏览器打开该 GitHub 仓库，把仓库 clone 到本地，或者下载 ZIP 后解压到一个你能找到的位置。");
  } else if (sourceType === "remoteZip") {
    steps.push("先把远程 ZIP 下载到本地并解压，然后在解压后的目录里继续后续安装步骤。");
  }

  if (commands.length > 0) {
    steps.push(`打开 ${shellLabel(environment)}，进入仓库根目录后再执行下面识别到的命令。`);
  }

  steps.push(...manualSteps);

  if (commands.length === 0 && manualSteps.length === 0) {
    steps.push(`没有识别到明确命令，请先在 ${osLabel(environment.os)} 上阅读 README 里的安装章节。`);
    steps.push(`如果这是一个 Skill，确认结构后再把技能目录复制到 ${targetSkillDirectoryLabel(environment)}。`);
  }

  return unique(steps);
}

function buildManualStrategy(
  reason: string | null,
  steps: string[],
  commands: string[],
  environment: EnvironmentInfo,
  workingDirectory?: string | null
): InstallStrategy {
  const requiredTools = collectRequiredTools(commands);

  return {
    type: commands.length > 0 ? "command" : "manual",
    title: "Manual install guide",
    reason,
    command: commands.length > 0 ? commands.join("\n") : null,
    workingDirectory: workingDirectory ?? inferWorkingDirectory(commands, steps),
    prerequisiteSteps: buildPrerequisiteSteps(requiredTools, environment),
    manualSteps: unique(steps),
    requiredTools,
    supportedPlatforms: ["win32", "darwin", "linux"],
    canAutoInstall: false
  };
}

export function analyzeRemoteReadmeWithRules(
  sourceType: SourceType,
  readme: string | null,
  environment: EnvironmentInfo
) {
  if (sourceType === "localZip") {
    return {
      type: "archiveCopy",
      title: "Local archive import",
      reason: "The ZIP file can be parsed locally and imported by the app.",
      command: null,
      workingDirectory: null,
      prerequisiteSteps: [],
      manualSteps: [],
      requiredTools: [],
      supportedPlatforms: ["win32", "darwin", "linux"],
      canAutoInstall: true
    } satisfies InstallStrategy;
  }

  if (sourceType === "remoteZip") {
    return buildArchiveInstallStrategy(
      "The remote ZIP can be recognized, but remote sources are treated as metadata-only and are not installed automatically.",
      environment
    );
  }

  if (!readme) {
    return buildManualStrategy(
      "README content was not found, so only basic repository metadata could be recognized.",
      [
        `先在 ${osLabel(environment.os)} 上打开仓库主页，手动阅读安装章节。`,
        `如果 README 里使用 npm、npx、pnpm 或 yarn，先确认本机已经安装 Node.js。`,
        `确认目录结构无误后，再把技能目录复制到 ${targetSkillDirectoryLabel(environment)}。`
      ],
      [],
      environment
    );
  }

  const commands = detectCommandCandidates(readme);
  const manualSteps = detectManualSteps(readme);
  const steps = buildRuleBasedSteps(sourceType, commands, manualSteps, environment);

  return buildManualStrategy(
    commands.length > 0
      ? `The repository includes install commands for ${osLabel(environment.os)} and they were summarized as manual steps.`
      : "The repository was recognized from README metadata and manual installation notes.",
    steps.length > 0
      ? steps
      : [
          `No explicit install command was found. Review the README manually on ${osLabel(environment.os)} before attempting installation.`,
          "If the repository mentions Node.js tooling, install Node.js first so npm and npx are available."
        ],
    commands,
    environment
  );
}

async function analyzeWithAi(input: {
  ai: AiSettings;
  sourceValue: string;
  readme: string | null;
  fallbackStrategy: InstallStrategy;
  environment: EnvironmentInfo;
}) {
  if (!input.ai.enabled || !input.ai.apiKey.trim() || !input.readme?.trim()) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${input.ai.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.ai.apiKey.trim()}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: input.ai.model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are an expert at analyzing software repositories. Return a JSON object with keys: name, description, summary, workingDirectory, installCommands, installSteps. \nRules:\n1. 'summary' must concisely explain what the skill does in Chinese.\n2. 'workingDirectory' should say where the user should run commands, such as 仓库根目录, 解压后的目录, or 全局终端.\n3. 'installSteps' must be an array of clean, beginner-friendly manual installation steps in Chinese.\n4. The steps must explicitly tell the user where to operate, what to install first if tools are missing, which commands to run, and where to copy the final skill files.\n5. DO NOT include raw Markdown symbols (like **, [], !) in installSteps. Provide pure actionable text.\n6. Do not claim the app can auto-install it."
          },
          {
            role: "user",
            content: `Repository URL: ${input.sourceValue}\nCurrent OS: ${osLabel(input.environment.os)}\nCurrent shell: ${shellLabel(input.environment)}\nDetected tools: ${input.environment.tools.map((tool) => `${tool.name}:${tool.available ? "yes" : "no"}`).join(", ")}\nTarget skill directory: ${targetSkillDirectoryLabel(input.environment)}\n\nREADME:\n${input.readme.slice(0, 12000)}`
          }
        ]
      })
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return null;
    }

    const parsed = JSON.parse(content) as {
      name?: string;
      description?: string;
      summary?: string;
      workingDirectory?: string;
      installCommands?: string[];
      installSteps?: string[];
    };

    const commands = Array.isArray(parsed.installCommands)
      ? unique(parsed.installCommands.filter((item) => typeof item === "string"))
      : [];
    const steps = Array.isArray(parsed.installSteps)
      ? unique(parsed.installSteps.filter((item) => typeof item === "string"))
      : [];

    return {
      detectedName: parsed.name?.trim() || null,
      detectedDescription: parsed.description?.trim() || null,
      analysisSummary: parsed.summary?.trim() || null,
      installStrategy: buildManualStrategy(
        "AI summarized the repository README and extracted manual installation guidance.",
        steps,
        commands,
        input.environment,
        parsed.workingDirectory?.trim() || null
      )
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeRemoteSource(input: RemoteAnalysisInput): Promise<RemoteAnalysisResult> {
  let readmeUrl: string | null = null;
  let readme: string | null = null;
  let archiveUrl: string | null = null;

  if (input.sourceType === "githubRepo" && isGitHubRepoUrl(input.sourceValue)) {
    archiveUrl = resolveGitHubArchiveUrl(input.sourceValue);
    readmeUrl = toRawGithubUrl(input.sourceValue, "README.md");
    readme =
      (await fetchText(readmeUrl)) ||
      (await fetchText(toRawGithubUrl(input.sourceValue, "readme.md"))) ||
      (await fetchText(toRawGithubUrl(input.sourceValue, "SKILL.md")));
  } else if (input.sourceType === "remoteZip") {
    archiveUrl = input.sourceValue;
  }

  const readmeExcerpt = normalizeReadmeExcerpt(readme);
  const installStrategy = analyzeRemoteReadmeWithRules(input.sourceType, readme, input.environment);
  
  let detectedDescription: string | null = null;
  if (readmeExcerpt) {
    const lines = readmeExcerpt.split(/\r?\n/).map(line => line.trim());
    for (const line of lines) {
      if (line && !line.startsWith("#") && !line.startsWith("![") && !line.startsWith("<") && !line.startsWith(">")) {
        detectedDescription = line.slice(0, 200);
        break;
      }
    }
  }

  const baseResult: RemoteAnalysisResult = {
    sourceType: input.sourceType,
    analysisMethod: "rules",
    detectedName: isGitHubRepoUrl(input.sourceValue) ? extractRepoOwnerAndName(input.sourceValue).repo : null,
    detectedDescription,
    analysisSummary: installStrategy.reason,
    archiveUrl,
    readmeUrl,
    readmeExcerpt,
    installStrategy
  };

  const aiResult = await analyzeWithAi({
    ai: input.ai,
    sourceValue: input.sourceValue,
    readme,
    fallbackStrategy: installStrategy,
    environment: input.environment
  });

  if (!aiResult) {
    return baseResult;
  }

  return {
    ...baseResult,
    analysisMethod: "rules+ai",
    detectedName: aiResult.detectedName || baseResult.detectedName,
    detectedDescription: aiResult.detectedDescription || baseResult.detectedDescription,
    analysisSummary: aiResult.analysisSummary || baseResult.analysisSummary,
    installStrategy: {
      ...aiResult.installStrategy,
      manualSteps:
        aiResult.installStrategy.manualSteps.length > 0
          ? aiResult.installStrategy.manualSteps
          : baseResult.installStrategy.manualSteps,
      prerequisiteSteps: unique([
        ...baseResult.installStrategy.prerequisiteSteps,
        ...aiResult.installStrategy.prerequisiteSteps
      ]),
      requiredTools: unique([
        ...baseResult.installStrategy.requiredTools,
        ...aiResult.installStrategy.requiredTools
      ])
    }
  };
}

export function serializeInstallStrategy(strategy: InstallStrategy | null) {
  return strategy ? JSON.stringify(strategy) : null;
}

export function parseInstallStrategy(value: string | null): InstallStrategy | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as InstallStrategy;
    return {
      ...parsed,
      prerequisiteSteps: Array.isArray(parsed.prerequisiteSteps) ? parsed.prerequisiteSteps : [],
      manualSteps: Array.isArray(parsed.manualSteps) ? parsed.manualSteps : [],
      requiredTools: Array.isArray(parsed.requiredTools) ? parsed.requiredTools : [],
      supportedPlatforms: Array.isArray(parsed.supportedPlatforms) ? parsed.supportedPlatforms : []
    };
  } catch {
    return null;
  }
}

export function requiresArchiveExtraction(staged: StagedSourceRecord) {
  return staged.installStrategy?.type === "archiveCopy" || staged.sourceType === "localZip";
}
