import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import type Database from "better-sqlite3";
import { dialog, shell } from "electron";

import type {
  DirectoryValidationResult,
  InstalledSkillDetail,
  InstalledSkillRecord,
  LogRecord,
  OperationResult,
  SaveSettingsInput,
  SettingsRecord,
  SkillManagerSnapshot,
  SourceType,
  StagedSourceDetail,
  StagedSourceRecord,
  WorkspaceSkillSource
} from "@shared/contracts";

import { createDatabase } from "./db";
import type { RuntimePaths } from "./runtime-paths";
import { resolveRuntimePaths } from "./runtime-paths";
import { detectSkillDirectory, slugifySkillName } from "./utils/skill-parser";
import { detectSourceType, resolveGitHubArchiveUrl, validateRemoteSource } from "./utils/source-url";
import { scanWorkspaceSkillSources } from "./utils/workspace-sources";

const execFileAsync = promisify(execFile);

interface SettingsRow {
  install_dir: string;
  temp_dir: string;
  conflict_policy: SettingsRecord["conflictPolicy"];
  theme: SettingsRecord["theme"];
  created_at: string;
  updated_at: string;
}

interface StagedRow {
  id: string;
  source_type: SourceType;
  source_value: string;
  status: StagedSourceRecord["status"];
  detected_name: string | null;
  detected_description: string | null;
  archive_path: string | null;
  skill_root_path: string | null;
  skill_md_path: string | null;
  install_path: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface InstalledRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  install_path: string;
  skill_md_path: string;
  source_type: SourceType;
  source_value: string;
  installed_at: string;
  updated_at: string;
}

interface LogRow {
  id: string;
  type: LogRecord["type"];
  level: LogRecord["level"];
  message: string;
  detail: string | null;
  related_id: string | null;
  created_at: string;
}

function nowIso() {
  return new Date().toISOString();
}

function toSettingsRecord(row: SettingsRow): SettingsRecord {
  return {
    installDir: row.install_dir,
    tempDir: row.temp_dir,
    conflictPolicy: row.conflict_policy,
    theme: row.theme,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toStagedRecord(row: StagedRow): StagedSourceRecord {
  return {
    id: row.id,
    sourceType: row.source_type,
    sourceValue: row.source_value,
    status: row.status,
    detectedName: row.detected_name,
    detectedDescription: row.detected_description,
    archivePath: row.archive_path,
    skillRootPath: row.skill_root_path,
    skillMdPath: row.skill_md_path,
    installPath: row.install_path,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toInstalledRecord(row: InstalledRow): InstalledSkillRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    installPath: row.install_path,
    skillMdPath: row.skill_md_path,
    sourceType: row.source_type,
    sourceValue: row.source_value,
    installedAt: row.installed_at,
    updatedAt: row.updated_at
  };
}

function toLogRecord(row: LogRow): LogRecord {
  return {
    id: row.id,
    type: row.type,
    level: row.level,
    message: row.message,
    detail: row.detail,
    relatedId: row.related_id,
    createdAt: row.created_at
  };
}

function resolveConfiguredOrFallbackPath(configuredPath: string, fallbackPath: string) {
  const normalized = configuredPath.trim();
  return normalized || fallbackPath;
}

function psQuote(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

async function safeReadText(filePath: string | null) {
  if (!filePath) {
    return null;
  }

  try {
    return await fsp.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

export class SkillManagerBackend {
  readonly paths: RuntimePaths;
  readonly database: Database.Database;

  constructor(userDataPath: string) {
    this.paths = resolveRuntimePaths(userDataPath);
    this.database = createDatabase(this.paths);
  }

  async getSnapshot(): Promise<SkillManagerSnapshot> {
    const settings = this.getSettings();
    const stagedSources = this.listStagedSources();
    const installedSkills = this.listInstalledSkills();
    const workspaceSkillSources = await this.getWorkspaceSkillSources();
    const logs = this.listLogs();
    const recentFailures = this.database
      .prepare("select * from logs where level = 'error' order by created_at desc limit 5")
      .all() as LogRow[];
    const recentInstalls = this.database
      .prepare("select * from installed_skills order by installed_at desc limit 5")
      .all() as InstalledRow[];
    const summaryCounts = this.database
      .prepare(
        `
          select
            (select count(*) from installed_skills) as installedCount,
            (select count(*) from staged_sources) as stagedCount,
            (select count(*) from staged_sources where status = 'ready') as readyCount,
            (select count(*) from staged_sources where status = 'error') as failedCount
        `
      )
      .get() as {
        installedCount: number;
        stagedCount: number;
        readyCount: number;
        failedCount: number;
      };

    return {
      settings,
      stagedSources,
      installedSkills,
      workspaceSkillSources,
      logs,
      summary: {
        ...summaryCounts,
        recentFailures: recentFailures.map(toLogRecord),
        recentInstalls: recentInstalls.map(toInstalledRecord)
      },
      runtime: {
        isDevelopment: this.paths.isDevelopment,
        appRoot: this.paths.appRoot,
        dataRoot: this.paths.dataRoot,
        databasePath: this.paths.databasePath,
        logsRoot: this.paths.logsRoot
      }
    };
  }

  async importLocalArchive(filePath: string): Promise<OperationResult<StagedSourceRecord>> {
    if (!filePath) {
      return { ok: false, error: "Please choose a local ZIP archive." };
    }

    const created = this.insertStagedSource("localZip", filePath);
    await this.parseStagedSources([created.id]);

    const refreshed = this.getStagedSource(created.id);
    if (!refreshed) {
      return { ok: false, error: "The imported archive could not be added to the staged list." };
    }

    return { ok: true, data: refreshed };
  }

  async addRemoteSource(url: string): Promise<OperationResult<StagedSourceRecord>> {
    const validation = validateRemoteSource(url);
    if (!validation.ok) {
      return { ok: false, error: validation.error };
    }

    const created = this.insertStagedSource(detectSourceType(url), url.trim());
    await this.writeLog("staged", "info", "Added a remote source to the staging area.", url.trim(), created.id);

    return { ok: true, data: created };
  }

  async parseStagedSources(ids: string[]): Promise<OperationResult<StagedSourceRecord[]>> {
    const settings = this.getSettings();
    const extractionParent = this.getWorkingTempRoot(settings);
    const parsedRecords: StagedSourceRecord[] = [];

    await this.ensureDirectory(extractionParent);

    for (const id of ids) {
      const staged = this.getStagedSource(id);
      if (!staged) {
        continue;
      }

      try {
        this.updateStagedSource(id, {
          status: "processing",
          errorMessage: null,
          updatedAt: nowIso()
        });

        const archivePath = await this.resolveArchivePath(staged);
        const extractionRoot = path.join(extractionParent, `extract-${id}`);

        await fsp.rm(extractionRoot, { recursive: true, force: true });
        await this.ensureDirectory(extractionRoot);
        await this.extractArchive(archivePath, extractionRoot);

        const parsed = await detectSkillDirectory(extractionRoot);
        this.updateStagedSource(id, {
          status: "ready",
          detectedName: parsed.name,
          detectedDescription: parsed.description,
          archivePath,
          skillRootPath: parsed.rootPath,
          skillMdPath: parsed.skillMdPath,
          errorMessage: null,
          updatedAt: nowIso()
        });

        const refreshed = this.getStagedSource(id);
        if (refreshed) {
          parsedRecords.push(refreshed);
        }

        await this.writeLog("staged", "info", `Parsed source successfully: ${parsed.name}`, staged.sourceValue, id);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown parse error.";
        this.updateStagedSource(id, {
          status: "error",
          errorMessage: message,
          updatedAt: nowIso()
        });
        await this.writeLog("staged", "error", "Failed to parse the staged source.", message, id);
      }
    }

    return { ok: true, data: parsedRecords };
  }

  async installStagedSources(ids: string[]): Promise<OperationResult<InstalledSkillRecord[]>> {
    const settings = this.getSettings();
    const installRoot = settings.installDir.trim();

    if (!installRoot) {
      await this.writeLog(
        "install",
        "warning",
        "Install blocked because no default install directory is configured.",
        "Open Settings and choose a default install directory before installing skills.",
        null
      );

      return {
        ok: false,
        error: "Please configure a default install directory in Settings before installing skills."
      };
    }

    const validation = await this.validateDirectory(installRoot);
    if (!validation.writable) {
      return {
        ok: false,
        error: validation.error || "The configured install directory is not writable."
      };
    }

    const installed: InstalledSkillRecord[] = [];

    for (const id of ids) {
      let staged = this.getStagedSource(id);
      if (!staged) {
        continue;
      }

      if (staged.status !== "ready") {
        await this.parseStagedSources([id]);
        staged = this.getStagedSource(id);
      }

      if (!staged || staged.status !== "ready" || !staged.skillRootPath || !staged.skillMdPath) {
        continue;
      }

      try {
        const slug = slugifySkillName(staged.detectedName || path.basename(staged.skillRootPath));
        const installPath = await this.resolveInstallPath(installRoot, slug, settings.conflictPolicy);

        if (settings.conflictPolicy === "overwrite") {
          await fsp.rm(installPath, { recursive: true, force: true });
        }

        await this.ensureDirectory(path.dirname(installPath));
        await fsp.cp(staged.skillRootPath, installPath, {
          recursive: true,
          force: false
        });

        const record: InstalledSkillRecord = {
          id: randomUUID(),
          name: staged.detectedName || slug,
          slug,
          description: staged.detectedDescription,
          installPath,
          skillMdPath: path.join(installPath, "SKILL.md"),
          sourceType: staged.sourceType,
          sourceValue: staged.sourceValue,
          installedAt: nowIso(),
          updatedAt: nowIso()
        };

        this.database.prepare("delete from installed_skills where install_path = ?").run(installPath);
        this.database
          .prepare(
            `
              insert into installed_skills (
                id, name, slug, description, install_path, skill_md_path, source_type, source_value, installed_at, updated_at
              ) values (
                @id, @name, @slug, @description, @installPath, @skillMdPath, @sourceType, @sourceValue, @installedAt, @updatedAt
              )
            `
          )
          .run(record);

        this.updateStagedSource(id, {
          status: "installed",
          installPath,
          updatedAt: nowIso()
        });

        await this.writeLog("install", "info", `Installed skill: ${record.name}`, installPath, id);
        installed.push(record);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown install error.";
        this.updateStagedSource(id, {
          status: "error",
          errorMessage: message,
          updatedAt: nowIso()
        });
        await this.writeLog("install", "error", "Failed to install the staged skill.", message, id);
      }
    }

    return { ok: true, data: installed };
  }

  async removeStagedSources(ids: string[]): Promise<OperationResult<number>> {
    if (ids.length === 0) {
      return { ok: true, data: 0 };
    }

    const statement = this.database.prepare("delete from staged_sources where id = ?");
    let removed = 0;

    for (const id of ids) {
      const staged = this.getStagedSource(id);
      if (staged?.skillRootPath) {
        await fsp.rm(path.dirname(staged.skillRootPath), { recursive: true, force: true });
      }
      if (staged?.archivePath && staged.sourceType !== "localZip") {
        await fsp.rm(staged.archivePath, { force: true });
      }

      const result = statement.run(id);
      removed += result.changes;
    }

    return { ok: true, data: removed };
  }

  async clearStagedSources(): Promise<OperationResult<number>> {
    const ids = this.listStagedSources().map((item) => item.id);
    return this.removeStagedSources(ids);
  }

  async getStagedSourceDetail(id: string): Promise<OperationResult<StagedSourceDetail>> {
    const staged = this.getStagedSource(id);
    if (!staged) {
      return { ok: false, error: "The selected staged source could not be found." };
    }

    return {
      ok: true,
      data: {
        ...staged,
        markdown: await safeReadText(staged.skillMdPath)
      }
    };
  }

  async getInstalledSkillDetail(id: string): Promise<OperationResult<InstalledSkillDetail>> {
    const installed = this.getInstalledSkill(id);
    if (!installed) {
      return { ok: false, error: "The selected installed skill could not be found." };
    }

    const exists = fs.existsSync(installed.installPath) && fs.existsSync(installed.skillMdPath);

    return {
      ok: true,
      data: {
        ...installed,
        markdown: await safeReadText(installed.skillMdPath),
        exists
      }
    };
  }

  async rescanInstalledSkill(id: string): Promise<OperationResult<InstalledSkillDetail>> {
    const installed = this.getInstalledSkill(id);
    if (!installed) {
      return { ok: false, error: "The selected installed skill could not be found." };
    }

    const parsed = await detectSkillDirectory(installed.installPath);
    this.database
      .prepare(
        `
          update installed_skills
          set name = ?, slug = ?, description = ?, skill_md_path = ?, updated_at = ?
          where id = ?
        `
      )
      .run(parsed.name, parsed.slug, parsed.description, parsed.skillMdPath, nowIso(), id);

    await this.writeLog("install", "info", `Rescanned installed skill: ${parsed.name}`, installed.installPath, id);
    return this.getInstalledSkillDetail(id);
  }

  async saveSettings(input: SaveSettingsInput): Promise<OperationResult<SettingsRecord>> {
    const installDir = input.installDir.trim();
    const tempDir = input.tempDir.trim();

    if (!installDir) {
      return { ok: false, error: "Please choose a default install directory before saving settings." };
    }

    const installValidation = await this.validateDirectory(installDir);
    if (!installValidation.writable) {
      return { ok: false, error: installValidation.error || "The install directory is not writable." };
    }

    if (tempDir) {
      const tempValidation = await this.validateDirectory(tempDir);
      if (!tempValidation.writable) {
        return { ok: false, error: tempValidation.error || "The temp directory is not writable." };
      }
    }

    this.database
      .prepare(
        `
          update settings
          set install_dir = ?, temp_dir = ?, conflict_policy = ?, updated_at = ?
          where id = 1
        `
      )
      .run(installDir, tempDir, input.conflictPolicy, nowIso());

    await this.writeLog(
      "settings",
      "info",
      "Saved skill manager settings.",
      `${installDir} | ${tempDir || this.paths.tempRoot}`,
      null
    );

    return { ok: true, data: this.getSettings() };
  }

  async validateDirectory(targetPath: string): Promise<DirectoryValidationResult> {
    const normalized = targetPath.trim();
    if (!normalized) {
      return {
        path: normalized,
        exists: false,
        writable: false,
        created: false,
        error: "Directory path is empty."
      };
    }

    let exists = fs.existsSync(normalized);
    let created = false;

    try {
      if (!exists) {
        await fsp.mkdir(normalized, { recursive: true });
        exists = true;
        created = true;
      }

      const probePath = path.join(normalized, `.skill-manager-write-test-${Date.now()}.tmp`);
      await fsp.writeFile(probePath, "ok", "utf8");
      await fsp.rm(probePath, { force: true });

      return {
        path: normalized,
        exists,
        writable: true,
        created
      };
    } catch (error) {
      return {
        path: normalized,
        exists,
        writable: false,
        created,
        error: error instanceof Error ? error.message : "Directory validation failed."
      };
    }
  }

  async openPath(targetPath: string): Promise<OperationResult<void>> {
    if (!targetPath.trim()) {
      return { ok: false, error: "There is no path to open yet." };
    }

    const result = await shell.openPath(targetPath);
    if (result) {
      return { ok: false, error: result };
    }

    return { ok: true };
  }

  async pickArchiveFile(): Promise<OperationResult<string | null>> {
    const result = await dialog.showOpenDialog({
      title: "Choose a ZIP archive",
      properties: ["openFile"],
      filters: [{ name: "ZIP Archive", extensions: ["zip"] }]
    });

    return {
      ok: true,
      data: result.canceled ? null : result.filePaths[0]
    };
  }

  async pickDirectory(initialPath?: string): Promise<OperationResult<string | null>> {
    const result = await dialog.showOpenDialog({
      title: "Choose a directory",
      defaultPath: initialPath || this.paths.dataRoot,
      properties: ["openDirectory", "createDirectory"]
    });

    return {
      ok: true,
      data: result.canceled ? null : result.filePaths[0]
    };
  }

  private getSettings() {
    const row = this.database.prepare("select * from settings where id = 1").get() as SettingsRow;
    return toSettingsRecord(row);
  }

  private listStagedSources() {
    const rows = this.database
      .prepare("select * from staged_sources order by created_at desc")
      .all() as StagedRow[];

    return rows.map(toStagedRecord);
  }

  private listInstalledSkills() {
    const rows = this.database
      .prepare("select * from installed_skills order by installed_at desc")
      .all() as InstalledRow[];

    return rows.map(toInstalledRecord);
  }

  private listLogs() {
    const rows = this.database
      .prepare("select * from logs order by created_at desc limit 80")
      .all() as LogRow[];

    return rows.map(toLogRecord);
  }

  private async getWorkspaceSkillSources(): Promise<WorkspaceSkillSource[]> {
    return scanWorkspaceSkillSources(this.paths.appRoot);
  }

  private getStagedSource(id: string) {
    const row = this.database.prepare("select * from staged_sources where id = ?").get(id) as StagedRow | undefined;
    return row ? toStagedRecord(row) : null;
  }

  private getInstalledSkill(id: string) {
    const row = this.database
      .prepare("select * from installed_skills where id = ?")
      .get(id) as InstalledRow | undefined;

    return row ? toInstalledRecord(row) : null;
  }

  private insertStagedSource(sourceType: SourceType, sourceValue: string) {
    const created: StagedSourceRecord = {
      id: randomUUID(),
      sourceType,
      sourceValue,
      status: "pending",
      detectedName: null,
      detectedDescription: null,
      archivePath: null,
      skillRootPath: null,
      skillMdPath: null,
      installPath: null,
      errorMessage: null,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    this.database
      .prepare(
        `
          insert into staged_sources (
            id, source_type, source_value, status, detected_name, detected_description,
            archive_path, skill_root_path, skill_md_path, install_path, error_message, created_at, updated_at
          ) values (
            @id, @sourceType, @sourceValue, @status, @detectedName, @detectedDescription,
            @archivePath, @skillRootPath, @skillMdPath, @installPath, @errorMessage, @createdAt, @updatedAt
          )
        `
      )
      .run(created);

    return created;
  }

  private updateStagedSource(
    id: string,
    nextValues: Partial<
      Pick<
        StagedSourceRecord,
        | "status"
        | "detectedName"
        | "detectedDescription"
        | "archivePath"
        | "skillRootPath"
        | "skillMdPath"
        | "installPath"
        | "errorMessage"
        | "updatedAt"
      >
    >
  ) {
    const existing = this.getStagedSource(id);
    if (!existing) {
      return;
    }

    const merged = {
      ...existing,
      ...nextValues,
      updatedAt: nextValues.updatedAt || nowIso()
    };
    const { id: _discardedId, ...rest } = merged;

    this.database
      .prepare(
        `
          update staged_sources
          set
            status = @status,
            detected_name = @detectedName,
            detected_description = @detectedDescription,
            archive_path = @archivePath,
            skill_root_path = @skillRootPath,
            skill_md_path = @skillMdPath,
            install_path = @installPath,
            error_message = @errorMessage,
            updated_at = @updatedAt
          where id = @id
        `
      )
      .run({
        id,
        ...rest
      });
  }

  private async resolveArchivePath(staged: StagedSourceRecord) {
    if (staged.sourceType === "localZip") {
      if (!fs.existsSync(staged.sourceValue)) {
        throw new Error("The selected ZIP archive no longer exists on disk.");
      }

      return staged.sourceValue;
    }

    const downloadUrl =
      staged.sourceType === "githubRepo"
        ? resolveGitHubArchiveUrl(staged.sourceValue)
        : staged.sourceValue;
    const archivePath = path.join(this.paths.cacheRoot, `${staged.id}.zip`);
    const response = await fetch(downloadUrl, {
      headers: {
        "User-Agent": "control-your-skills"
      }
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fsp.writeFile(archivePath, buffer);
    return archivePath;
  }

  private async extractArchive(archivePath: string, destinationPath: string) {
    const command = `Expand-Archive -LiteralPath ${psQuote(archivePath)} -DestinationPath ${psQuote(
      destinationPath
    )} -Force`;

    await execFileAsync("powershell.exe", ["-NoProfile", "-Command", command], {
      windowsHide: true
    });
  }

  private async resolveInstallPath(
    installRoot: string,
    slug: string,
    conflictPolicy: SettingsRecord["conflictPolicy"]
  ) {
    const basePath = path.join(installRoot, slug);
    if (!fs.existsSync(basePath)) {
      return basePath;
    }

    if (conflictPolicy === "skip") {
      throw new Error(`The target install directory already exists: ${basePath}`);
    }

    if (conflictPolicy === "overwrite") {
      return basePath;
    }

    let suffix = 1;
    while (fs.existsSync(path.join(installRoot, `${slug}-${suffix}`))) {
      suffix += 1;
    }

    return path.join(installRoot, `${slug}-${suffix}`);
  }

  private getWorkingTempRoot(settings: SettingsRecord) {
    return resolveConfiguredOrFallbackPath(settings.tempDir, this.paths.tempRoot);
  }

  private async ensureDirectory(targetPath: string) {
    await fsp.mkdir(targetPath, { recursive: true });
  }

  private async writeLog(
    type: LogRecord["type"],
    level: LogRecord["level"],
    message: string,
    detail: string | null,
    relatedId: string | null
  ) {
    this.database
      .prepare(
        `
          insert into logs (id, type, level, message, detail, related_id, created_at)
          values (?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(randomUUID(), type, level, message, detail, relatedId, nowIso());
  }
}
