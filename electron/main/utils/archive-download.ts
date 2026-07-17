import fsp from "node:fs/promises";

export const DEFAULT_REMOTE_ARCHIVE_MAX_BYTES = 100 * 1024 * 1024;
export const DEFAULT_REMOTE_ARCHIVE_TIMEOUT_MS = 30_000;

interface DownloadRemoteArchiveOptions {
  fetchImpl?: typeof fetch;
  maxBytes?: number;
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
    timeoutMs = DEFAULT_REMOTE_ARCHIVE_TIMEOUT_MS
  }: DownloadRemoteArchiveOptions = {}
) {
  validateDownloadUrl(downloadUrl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(downloadUrl, {
      headers: { "User-Agent": "control-your-skills" },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    if (response.url) {
      validateDownloadUrl(response.url);
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
