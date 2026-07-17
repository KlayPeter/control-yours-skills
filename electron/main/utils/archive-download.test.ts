import fs from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { downloadRemoteArchive } from "./archive-download";

const createdDirectories: string[] = [];

async function createTempDirectory() {
  const tempRoot = path.join(process.cwd(), ".tmp-tests");
  await fs.mkdir(tempRoot, { recursive: true });
  const directory = await fs.mkdtemp(path.join(tempRoot, "archive-download-test-"));
  createdDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    createdDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true }))
  );
});

describe("downloadRemoteArchive", () => {
  it("writes a successful HTTPS response to disk", async () => {
    const directory = await createTempDirectory();
    const archivePath = path.join(directory, "skill.zip");
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), { status: 200 })
    );

    await downloadRemoteArchive("https://example.com/skill.zip", archivePath, { fetchImpl });

    await expect(fs.readFile(archivePath)).resolves.toEqual(Buffer.from([1, 2, 3]));
  });

  it("rejects non-HTTPS downloads before making a request", async () => {
    const directory = await createTempDirectory();
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      downloadRemoteArchive("http://example.com/skill.zip", path.join(directory, "skill.zip"), { fetchImpl })
    ).rejects.toThrow("HTTPS");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects archives whose advertised size exceeds the configured limit", async () => {
    const directory = await createTempDirectory();
    const archivePath = path.join(directory, "skill.zip");
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(new Uint8Array([1]), {
        status: 200,
        headers: { "content-length": "11" }
      })
    );

    await expect(
      downloadRemoteArchive("https://example.com/skill.zip", archivePath, { fetchImpl, maxBytes: 10 })
    ).rejects.toThrow("download limit");
    await expect(fs.access(archivePath)).rejects.toThrow();
  });

  it("stops streamed downloads that exceed the configured limit", async () => {
    const directory = await createTempDirectory();
    const archivePath = path.join(directory, "skill.zip");
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(11));
        controller.close();
      }
    });
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(body, { status: 200 }));

    await expect(
      downloadRemoteArchive("https://example.com/skill.zip", archivePath, { fetchImpl, maxBytes: 10 })
    ).rejects.toThrow("download limit");
    await expect(fs.access(archivePath)).rejects.toThrow();
  });
});
