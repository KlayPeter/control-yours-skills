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
  const url = new URL(normalizeGitHubRepositoryUrl(source));
  const [owner, repo] = url.pathname.split("/").filter(Boolean);

  return `https://github.com/${owner}/${repo}/archive/HEAD.zip`;
}

export function normalizeGitHubRepositoryUrl(source: string) {
  const url = new URL(source.trim());
  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "github.com" || url.username || url.password) {
    throw new Error("Trusted installation requires a public HTTPS GitHub repository URL.");
  }

  const [owner, repoWithSuffix] = url.pathname.split("/").filter(Boolean);
  const repo = repoWithSuffix?.replace(/\.git$/i, "");
  if (!owner || !repo) {
    throw new Error("Trusted installation requires a GitHub owner and repository name.");
  }

  return `https://github.com/${owner}/${repo}`;
}

export function validateRemoteSource(source: string) {
  const trimmed = source.trim();

  if (!trimmed) {
    return {
      ok: false as const,
      error: "Please enter a remote source URL."
    };
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") {
      return {
        ok: false as const,
        error: "Only HTTPS remote URLs are supported."
      };
    }

    if (url.username || url.password) {
      return {
        ok: false as const,
        error: "Remote source URLs cannot include credentials."
      };
    }

    if (isGitHubRepoUrl(trimmed) || ZIP_URL_PATTERN.test(trimmed)) {
      return { ok: true as const };
    }

    return {
      ok: false as const,
      error: "Use a GitHub repository URL or a direct .zip download URL."
    };
  } catch {
    return {
      ok: false as const,
      error: "The remote source URL format is invalid."
    };
  }
}
