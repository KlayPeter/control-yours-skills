import { lookup } from "node:dns/promises";
import fsp from "node:fs/promises";
import { isIP } from "node:net";

export const DEFAULT_REMOTE_ARCHIVE_MAX_BYTES = 100 * 1024 * 1024;
export const DEFAULT_REMOTE_ARCHIVE_TIMEOUT_MS = 30_000;
const MAX_REDIRECTS = 5;

type ResolveHost = (hostname: string) => Promise<string[]>;

interface DownloadRemoteArchiveOptions {
  fetchImpl?: typeof fetch;
  maxBytes?: number;
  resolveHost?: ResolveHost;
  timeoutMs?: number;
}

function validateDownloadUrl(urlString: string) {
  const url = new URL(urlString);

  if (url.protocol !== "https:") {
    throw new Error("Remote archive downloads require an HTTPS URL.");
  }

  if (url.username || url.password) {
    throw new Error("Remote archive URLs cannot include credentials.");
  }
}

function isPrivateAddress(address: string) {
  if (isIP(address) === 4) {
    const [first, second] = address.split(".").map(Number);
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      first >= 224 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 198 && (second === 18 || second === 19))
    );
  }

  const normalized = address.toLowerCase();
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.") ||
    normalized.startsWith("::ffff:169.254.")
  );
}

async function defaultResolveHost(hostname: string) {
  if (isIP(hostname)) {
    return [hostname];
  }

  return (await lookup(hostname, { all: true, verbatim: true })).map((result) => result.address);
}

async function validateDownloadTarget(urlString: string, resolveHost: ResolveHost) {
  validateDownloadUrl(urlString);
  const url = new URL(urlString);
  const hostname = url.hostname.toLowerCase();

  if (hostname === "localhost" || hostname.endsWith(".local")) {
    throw new Error("Remote archive URLs cannot target local network hosts.");
  }

  const addresses = await resolveHost(hostname);
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new Error("Remote archive URLs cannot target private network addresses.");
  }
}

function contentLengthExceedsLimit(response: Response, maxBytes: number) {
  const contentLength = response.headers.get("content-length");
  if (!contentLength) {
    return false;
  }

  const size = Number(contentLength);
  return Number.isFinite(size) && size > maxBytes;
}

async function readResponseBody(response: Response, maxBytes: number) {
  if (!response.body) {
    return Buffer.alloc(0);
  }

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    const chunk = Buffer.from(value);
    totalBytes += chunk.length;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new Error(`Remote archive exceeds the ${maxBytes} byte download limit.`);
    }

    chunks.push(chunk);
  }

  return Buffer.concat(chunks, totalBytes);
}

export async function downloadRemoteArchive(
  downloadUrl: string,
  archivePath: string,
  {
    fetchImpl = fetch,
    maxBytes = DEFAULT_REMOTE_ARCHIVE_MAX_BYTES,
    resolveHost = defaultResolveHost,
    timeoutMs = DEFAULT_REMOTE_ARCHIVE_TIMEOUT_MS
  }: DownloadRemoteArchiveOptions = {}
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let currentUrl = downloadUrl;
    let response: Response | null = null;

    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      await validateDownloadTarget(currentUrl, resolveHost);
      response = await fetchImpl(currentUrl, {
        headers: { "User-Agent": "control-your-skills" },
        redirect: "manual",
        signal: controller.signal
      });

      if (response.status < 300 || response.status >= 400) {
        break;
      }

      const location = response.headers.get("location");
      if (!location) {
        throw new Error("Download redirect did not include a destination URL.");
      }

      if (redirectCount === MAX_REDIRECTS) {
        throw new Error("Remote archive exceeded the redirect limit.");
      }

      currentUrl = new URL(location, currentUrl).toString();
    }

    if (!response) {
      throw new Error("Download did not return a response.");
    }

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    if (contentLengthExceedsLimit(response, maxBytes)) {
      throw new Error(`Remote archive exceeds the ${maxBytes} byte download limit.`);
    }

    await fsp.writeFile(archivePath, await readResponseBody(response, maxBytes));
  } catch (error) {
    await fsp.rm(archivePath, { force: true });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
