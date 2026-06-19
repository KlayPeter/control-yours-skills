import { randomUUID } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
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
  StagedSourceRecord
} from "@shared/contracts";

import { createDatabase } from "./db";
import type { RuntimePaths } from "./runtime-paths";
import { resolveRuntimePaths } from "./runtime-paths";
import { detectSkillDirectory, slugifySkillName } from "./utils/skill-parser";
import { detectSourceType, resolveGitHubArchiveUrl, validateRemoteSource } from "./utils/source-url";

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

function psQuote(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
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
      return { ok: false, error: "请选择一个 ZIP 文件。" };
    }

    const created = this.insertStagedSource("localZip", filePath);
    await this.parseStagedSources([created.id]);

    const refreshed = this.getStagedSource(created.id);
    if (!refreshed) {
      return { ok: false, error: "导入后的暂存记录未能成功写入。" };
    }

    return { ok: true, data: refreshed };
  }

  async addRemoteSource(url: string): Promise<OperationResult<StagedSourceRecord>> {
    const validation = validateRemoteSource(url);
    if (!validation.ok) {
      return { ok: false, error: validation.error };
    }

    const created = this.insertStagedSource(detectSourceType(url), url.trim());
    await this.writeLog("staged", "info", "已加入远程来源到暂存区。", url.trim(), created.id);
    return { ok: true, data: created };
  }

  async parseStagedSources(ids: string[]): Promise<OperationResult<StagedSourceRecord[]>> {
    const results: StagedSourceRecord[] = [];

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
        const extractionRoot = path.join(this.paths.tempRoot, `extract-${id}`);

        await fsp.rm(extractionRoot, { recursive: true, force: true });
        await fsp.mkdir(extractionRoot, { recursive: true });
        await this.extractArchive(archivePath, extractionRoot);

        const parsed = await detectSkillDirectory(extractionRoot);
        const updatedAt = nowIso();

        this.updateStagedSource(id, {
          status: "ready",
          detectedName: parsed.name,
          detectedDescription: parsed.description,
          archivePath,
          skillRootPath: parsed.rootPath,
          skillMdPath: parsed.skillMdPath,
          errorMessage: null,
          updatedAt
        });

        await this.writeLog("staged", "info", `成功解析来源：${parsed.name}`, staged.sourceValue, id);
        const refreshed = this.getStagedSource(id);
        if (refreshed) {
          results.push(refreshed);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "解析暂存来源时发生未知错误。";
        this.updateStagedSource(id, {
          status: "error",
          errorMessage: message,
          updatedAt: nowIso()
        });
        await this.writeLog("staged", "error", "解析暂存来源失败。", message, id);
      }
    }

    return { ok: true, data: results };
  }

  async installStagedSources(ids: string[]): Promise<OperationResult<InstalledSkillRecord[]>> {
    const settings = this.getSettings();
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
        const installPath = await this.resolveInstallPath(settings.installDir, slug, settings.conflictPolicy);
        const targetSkillMdPath = path.join(installPath, "SKILL.md");

        if (settings.conflictPolicy === "overwrite") {
          await fsp.rm(installPath, { recursive: true, force: true });
        }

        await fsp.mkdir(path.dirname(installPath), { recursive: true });
        await fsp.cp(staged.skillRootPath, installPath, { recursive: true, force: false });

        const now = nowIso();
        const record: InstalledSkillRecord = {
          id: randomUUID(),
          name: staged.detectedName || slug,
          slug,
          description: staged.detectedDescription,
          installPath,
          skillMdPath: targetSkillMdPath,
          sourceType: staged.sourceType,
          sourceValue: staged.sourceValue,
          installedAt: now,
          updatedAt: now
        };

        this.database
          .prepare("delete from installed_skills where install_path = ?")
          .run(installPath);
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
          updatedAt: now
        });

        await this.writeLog("install", "info", `已安装 Skill：${record.name}`, installPath, id);
        installed.push(record);
      } catch (error) {
        const message = error instanceof Error ? error.message : "安装 Skill 时发生未知错误。";
        this.updateStagedSource(id, {
          status: "error",
          errorMessage: message,
          updatedAt: nowIso()
        });
        await this.writeLog("install", "error", "安装 Skill 失败。", message, id);
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
    const allIds = this.listStagedSources().map((item) => item.id);
    return this.removeStagedSources(allIds);
  }

  async getStagedSourceDetail(id: string): Promise<OperationResult<StagedSourceDetail>> {
    const staged = this.getStagedSource(id);
    if (!staged) {
      return { ok: false, error: "未找到对应的暂存项。" };
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
    const skill = this.getInstalledSkill(id);
    if (!skill) {
      return { ok: false, error: "未找到对应的已安装 Skill。" };
    }

    const exists = fs.existsSync(skill.installPath) && fs.existsSync(skill.skillMdPath);

    return {
      ok: true,
      data: {
        ...skill,
        markdown: await safeReadText(skill.skillMdPath),
        exists
      }
    };
  }

  async rescanInstalledSkill(id: string): Promise<OperationResult<InstalledSkillDetail>> {
    const skill = this.getInstalledSkill(id);
    if (!skill) {
      return { ok: false, error: "未找到对应的已安装 Skill。" };
    }

    const parsed = await detectSkillDirectory(skill.installPath);
    const updatedAt = nowIso();

    this.database
      .prepare(
        `
          update installed_skills
          set name = ?, slug = ?, description = ?, skill_md_path = ?, updated_at = ?
          where id = ?
        `
      )
      .run(parsed.name, parsed.slug, parsed.description, parsed.skillMdPath, updatedAt, id);

    await this.writeLog("install", "info", `已重新扫描 Skill：${parsed.name}`, skill.installPath, id);
    return this.getInstalledSkillDetail(id);
  }

  async saveSettings(input: SaveSettingsInput): Promise<OperationResult<SettingsRecord>> {
    const installDir = input.installDir.trim();
    const tempDir = input.tempDir.trim();

    if (!installDir || !tempDir) {
      return { ok: false, error: "安装目录和临时目录都不能为空。" };
    }

    const installValidation = await this.validateDirectory(installDir);
    if (!installValidation.writable) {
      return { ok: false, error: installValidation.error || "安装目录不可写。" };
    }

    const tempValidation = await this.validateDirectory(tempDir);
    if (!tempValidation.writable) {
      return { ok: false, error: tempValidation.error || "临时目录不可写。" };
    }

    const updatedAt = nowIso();
    this.database
      .prepare(
        `
          update settings
          set install_dir = ?, temp_dir = ?, conflict_policy = ?, updated_at = ?
          where id = 1
        `
      )
      .run(installDir, tempDir, input.conflictPolicy, updatedAt);

    await this.writeLog("settings", "info", "已保存设置。", `${installDir} | ${tempDir}`, null);
    return { ok: true, data: this.getSettings() };
  }

  async validateDirectory(targetPath: string): Promise<DirectoryValidationResult> {
    const normalized = targetPath.trim();
    let exists = fs.existsSync(normalized);
    let created = false;

    try {
      if (!exists) {
        await fsp.mkdir(normalized, { recursive: true });
        exists = true;
        created = true;
      }

      const writeProbePath = path.join(normalized, `.skill-manager-write-test-${Date.now()}.tmp`);
      await fsp.writeFile(writeProbePath, "ok", "utf8");
      await fsp.rm(writeProbePath, { force: true });

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
        error: error instanceof Error ? error.message : "目录检查失败。"
      };
    }
  }

  async openPath(targetPath: string): Promise<OperationResult<void>> {
    const result = await shell.openPath(targetPath);
    if (result) {
      return { ok: false, error: result };
    }

    return { ok: true };
  }

  async pickArchiveFile(): Promise<OperationResult<string | null>> {
    const result = await dialog.showOpenDialog({
      title: "选择 ZIP 文件",
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
      title: "选择目录",
      defaultPath: initialPath || this.paths.installRoot,
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

  private getStagedSource(id: string) {
    const row = this.database
      .prepare("select * from staged_sources where id = ?")
      .get(id) as StagedRow | undefined;

    return row ? toStagedRecord(row) : null;
  }

  private getInstalledSkill(id: string) {
    const row = this.database
      .prepare("select * from installed_skills where id = ?")
      .get(id) as InstalledRow | undefined;

    return row ? toInstalledRecord(row) : null;
  }

  private insertStagedSource(sourceType: SourceType, sourceValue: string) {
    const now = nowIso();
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
      createdAt: now,
      updatedAt: now
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
    input: Partial<
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

    const next = {
      ...existing,
      ...input,
      updatedAt: input.updatedAt || nowIso()
    };
    const { id: _id, ...rest } = next;

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
      const exists = fs.existsSync(staged.sourceValue);
      if (!exists) {
        throw new Error("本地 ZIP 文件不存在，可能已经被移动或删除。");
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
      throw new Error(`下载失败：${response.status} ${response.statusText}`);
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
      throw new Error(`目标目录已存在：${basePath}`);
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
