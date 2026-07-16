import fs from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createDatabase } from "./db";
import type { RuntimePaths } from "./runtime-paths";

const createdDirectories: string[] = [];

async function createTestPaths(): Promise<RuntimePaths> {
  const testRoot = path.join(process.cwd(), ".tmp-tests");
  await fs.mkdir(testRoot, { recursive: true });

  const dataRoot = await fs.mkdtemp(path.join(testRoot, "database-test-"));
  createdDirectories.push(dataRoot);

  return {
    appRoot: process.cwd(),
    dataRoot,
    databasePath: path.join(dataRoot, "app.db"),
    installRoot: path.join(dataRoot, "installed-skills"),
    tempRoot: path.join(dataRoot, "temp"),
    cacheRoot: path.join(dataRoot, "cache"),
    logsRoot: path.join(dataRoot, "logs"),
    isDevelopment: true,
    homeDir: dataRoot
  };
}

function closeDatabase(database: ReturnType<typeof createDatabase>) {
  (database as typeof database & { close(): void }).close();
}

afterEach(async () => {
  await Promise.all(
    createdDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true }))
  );
});

describe("createDatabase", () => {
  it("disables AI by default when no API key is configured", async () => {
    const paths = await createTestPaths();
    const database = createDatabase(paths);
    const settings = database
      .prepare("select ai_enabled, ai_api_key from settings where id = 1")
      .get() as { ai_enabled: number; ai_api_key: string };

    expect(settings).toEqual({ ai_enabled: 0, ai_api_key: "" });
    closeDatabase(database);
  });

  it("clears the legacy placeholder key and disables AI", async () => {
    const paths = await createTestPaths();
    const originalDatabase = createDatabase(paths);
    originalDatabase
      .prepare("update settings set ai_enabled = 1, ai_api_key = 'xxx' where id = 1")
      .run();
    closeDatabase(originalDatabase);

    const migratedDatabase = createDatabase(paths);
    const settings = migratedDatabase
      .prepare("select ai_enabled, ai_api_key from settings where id = 1")
      .get() as { ai_enabled: number; ai_api_key: string };

    expect(settings).toEqual({ ai_enabled: 0, ai_api_key: "" });
    closeDatabase(migratedDatabase);
  });
});
