import type { SourceType } from "@shared/contracts";

const ZIP_URL_PATTERN = /\.zip(?:$|\?)/i;

export function detectSourceType(source: string): SourceType {
  const normalized = source.trim();

  if (isGitHubRepoUrl(normalized)) {
    return "githubRepo";
  }

  return "remoteZip";
}

export function isGitHubRepoUrl(source: string) {
  try {
    const url = new URL(source);
    if (url.hostname !== "github.com") {
      return false;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    return parts.length >= 2 && !parts[1].endsWith(".zip");
  } catch {
    return false;
  }
}

export function resolveGitHubArchiveUrl(source: string) {
  const url = new URL(source);
  const [owner, repoWithSuffix] = url.pathname.split("/").filter(Boolean);
  const repo = repoWithSuffix.replace(/\.git$/i, "");

  return `https://github.com/${owner}/${repo}/archive/HEAD.zip`;
}

export function validateRemoteSource(source: string) {
  const trimmed = source.trim();

  if (!trimmed) {
    return {
      ok: false as const,
      error: "请输入一个可访问的 GitHub 仓库地址或 ZIP 下载地址。"
    };
  }

  try {
    const url = new URL(trimmed);
    if (!["http:", "https:"].includes(url.protocol)) {
      return {
        ok: false as const,
        error: "当前仅支持 http 或 https 远程地址。"
      };
    }

    if (isGitHubRepoUrl(trimmed) || ZIP_URL_PATTERN.test(trimmed)) {
      return { ok: true as const };
    }

    return {
      ok: false as const,
      error: "当前 MVP 仅支持 GitHub 仓库地址或以 .zip 结尾的下载地址。"
    };
  } catch {
    return {
      ok: false as const,
      error: "远程地址格式不正确，请检查后重试。"
    };
  }
}
