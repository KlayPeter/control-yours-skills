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

async function analyzeWithAi(input: {
  ai: AiSettings;
  sourceValue: string;
  readme: string | null;
  fallbackStrategy: InstallStrategy;
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
              "You analyze skill repositories. Return JSON with keys name, description, summary, installType, command, manualSteps. Prefer command only when README explicitly gives an install command."
          },
          {
            role: "user",
            content: `Repository URL: ${input.sourceValue}\n\nREADME:\n${input.readme.slice(0, 12000)}`
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

    try {
      const parsed = JSON.parse(content) as {
        name?: string;
        description?: string;
        summary?: string;
        installType?: "archiveCopy" | "command" | "manual";
        command?: string;
        manualSteps?: string[];
      };

      let installStrategy = input.fallbackStrategy;
      if (parsed.installType === "command" && parsed.command?.trim()) {
        installStrategy = buildCommandStrategy(parsed.command.trim(), "AI extracted an explicit install command from the README.");
      } else if (parsed.installType === "manual") {
        installStrategy = buildManualStrategy(
          "AI determined that manual installation steps are required.",
          Array.isArray(parsed.manualSteps) ? parsed.manualSteps.filter(Boolean).slice(0, 8) : []
        );
      }

      return {
        detectedName: parsed.name?.trim() || null,
        detectedDescription: parsed.description?.trim() || null,
        analysisSummary: parsed.summary?.trim() || null,
        installStrategy
      };
    } catch {
      return null;
    }
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

  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8)
    .join("\n")
    .slice(0, 1200);
}

function detectCommandCandidates(readme: string) {
  const lines = readme.split(/\r?\n/).map((line) => line.trim());
  const commands: string[] = [];

  for (const line of lines) {
    if (/^(npm|pnpm|yarn|uv|pip|python|py|git)\s+/i.test(line)) {
      commands.push(line);
    }
  }

  return [...new Set(commands)];
}

function detectManualSteps(readme: string) {
  const lines = readme.split(/\r?\n/).map((line) => line.trim());
  const steps = lines.filter((line) =>
    /(copy|move|place|install to|\.codex|\.claude|\.agents|skills)/i.test(line)
  );

  return [...new Set(steps)].slice(0, 6);
}

function buildArchiveInstallStrategy(reason: string | null): InstallStrategy {
  return {
    type: "archiveCopy",
    title: "Archive copy install",
    reason,
    command: null,
    workingDirectory: null,
    manualSteps: [],
    requiredTools: [],
    supportedPlatforms: ["win32", "darwin", "linux"],
    canAutoInstall: true
  };
}

function buildManualStrategy(reason: string | null, steps: string[]): InstallStrategy {
  return {
    type: "manual",
    title: "Manual install required",
    reason,
    command: null,
    workingDirectory: null,
    manualSteps: steps,
    requiredTools: [],
    supportedPlatforms: ["win32", "darwin", "linux"],
    canAutoInstall: false
  };
}

function buildCommandStrategy(command: string, reason: string | null): InstallStrategy {
  const requiredTools = [command.split(/\s+/)[0].toLowerCase()];

  return {
    type: "command",
    title: "Command install",
    reason,
    command,
    workingDirectory: null,
    manualSteps: [],
    requiredTools,
    supportedPlatforms: ["win32", "darwin", "linux"],
    canAutoInstall: true
  };
}

function chooseStrategyFromRules(sourceType: SourceType, readme: string | null, environment: EnvironmentInfo) {
  if (sourceType === "localZip" || sourceType === "remoteZip") {
    return buildArchiveInstallStrategy("ZIP sources can be installed by extracting and copying the skill directory.");
  }

  if (!readme) {
    return buildArchiveInstallStrategy("No README install instructions were found, so the app will try the archive copy flow.");
  }

  const commands = detectCommandCandidates(readme);
  const manualSteps = detectManualSteps(readme);

  const compatibleCommand = commands.find((command) => {
    const tool = command.split(/\s+/)[0].toLowerCase();
    return environment.tools.some((entry) => entry.name === tool && entry.available);
  });

  if (compatibleCommand) {
    return buildCommandStrategy(compatibleCommand, "A compatible install command was detected in the repository README.");
  }

  if (commands.length > 0) {
    return buildManualStrategy("The repository provides install commands, but the required tool is not available locally.", commands);
  }

  if (manualSteps.length > 0) {
    return buildManualStrategy("Manual installation steps were detected in the repository README.", manualSteps);
  }

  return buildArchiveInstallStrategy("No explicit install command was found, so the app will try the archive copy flow.");
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
  const installStrategy = chooseStrategyFromRules(input.sourceType, readme, input.environment);
  const baseResult: RemoteAnalysisResult = {
    sourceType: input.sourceType,
    analysisMethod: readme ? "rules" : "rules",
    detectedName: isGitHubRepoUrl(input.sourceValue) ? extractRepoOwnerAndName(input.sourceValue).repo : null,
    detectedDescription: null,
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
    fallbackStrategy: installStrategy
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
    installStrategy: aiResult.installStrategy
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
    return JSON.parse(value) as InstallStrategy;
  } catch {
    return null;
  }
}

export function requiresArchiveExtraction(staged: StagedSourceRecord) {
  return staged.installStrategy?.type === "archiveCopy" || staged.sourceType === "localZip" || staged.sourceType === "remoteZip";
}
