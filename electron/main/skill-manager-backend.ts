import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import type Database from "better-sqlite3";
import { dialog, shell } from "electron";

import type {
  EnvironmentInfo,
  ExportInstalledSkillInput,
  ImportedProjectRecord,
  DirectoryValidationResult,
  InstallStrategy,
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
import { detectEnvironment, hasRequiredTools } from "./utils/environment";
import { analyzeRemoteSource, parseInstallStrategy, requiresArchiveExtraction, serializeInstallStrategy } from "./utils/remote-analysis";
import { detectSkillDirectory, slugifySkillName } from "./utils/skill-parser";
import { detectSourceType, resolveGitHubArchiveUrl, validateRemoteSource } from "./utils/source-url";
import { resolveSystemProviderSkillPath, scanSystemSkillSources, scanWorkspaceSkillSources } from "./utils/workspace-sources";

const execFileAsync = promisify(execFile);

interface SettingsRow {
  install_dir: string;
  temp_dir: string;
  project_dir: string;
  project_dirs: string;
  conflict_policy: SettingsRecord["conflictPolicy"];
  theme: SettingsRecord["theme"];
  locale: SettingsRecord["locale"];
  ai_provider: SettingsRecord["ai"]["provider"];
  ai_enabled: number;
  ai_base_url: string;
  ai_api_key: string;
  ai_model: string;
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
  analysis_method: StagedSourceRecord["analysisMethod"];
  analysis_summary: string | null;
  install_strategy: string | null;
  readme_url: string | null;
  readme_excerpt: string | null;
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

function parseProjectDirs(projectDirsRaw: string, legacyProjectDir: string) {
  try {
    const parsed = JSON.parse(projectDirsRaw || "[]");
    if (Array.isArray(parsed)) {
      const normalized = parsed
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean);

      if (normalized.length > 0) {
        return [...new Set(normalized)];
      }
    }
  } catch {
    // Fall back to the legacy single-project field below.
  }

  const legacy = legacyProjectDir.trim();
  return legacy ? [legacy] : [];
}

function toSettingsRecord(row: SettingsRow): SettingsRecord {
  return {
    installDir: row.install_dir,
    tempDir: row.temp_dir,
    projectDirs: parseProjectDirs(row.project_dirs, row.project_dir),
    conflictPolicy: row.conflict_policy,
    theme: row.theme,
    locale: row.locale,
    ai: {
      enabled: Boolean(row.ai_enabled),
      provider: row.ai_provider,
      baseUrl: row.ai_base_url,
      apiKey: row.ai_api_key,
      model: row.ai_model
    },
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
    analysisMethod: row.analysis_method,
    analysisSummary: row.analysis_summary,
    installStrategy: parseInstallStrategy(row.install_strategy),
    readmeUrl: row.readme_url,
    readmeExcerpt: row.readme_excerpt,
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
  environmentCache: EnvironmentInfo | null = null;

  constructor(userDataPath: string) {
    this.paths = resolveRuntimePaths(userDataPath);
    this.database = createDatabase(this.paths);
  }

  async getSnapshot(): Promise<SkillManagerSnapshot> {
    const settings = this.getSettings();
    const environment = await this.getEnvironmentInfo();
    const stagedSources = this.listStagedSources();
    const installedSkills = this.listInstalledSkills();
    const importedProjects = await this.getImportedProjects(settings.projectDirs);
    const workspaceSkillSources = importedProjects.flatMap((project) => project.sources);
    const systemSkillSources = await this.getSystemSkillSources();
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
      importedProjects,
      workspaceSkillSources,
      systemSkillSources,
      logs,
      summary: {
        ...summaryCounts,
        recentFailures: recentFailures.map(toLogRecord),
        recentInstalls: recentInstalls.map(toInstalledRecord)
      },
      runtime: {
        isDevelopment: this.paths.isDevelopment,
        appRoot: this.paths.appRoot,
        rendererUrl: process.env.ELECTRON_RENDERER_URL || "http://127.0.0.1:3211",
        dataRoot: this.paths.dataRoot,
        databasePath: this.paths.databasePath,
        logsRoot: this.paths.logsRoot,
        platform: process.platform,
        homeDir: this.paths.homeDir,
        environment
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

    const refreshed = this.getStagedSource(created.id);
    if (!refreshed) {
      return { ok: false, error: "The remote source could not be added to the staged list." };
    }

    return { ok: true, data: refreshed };
  }

  async parseStagedSources(ids: string[]): Promise<OperationResult<StagedSourceRecord[]>> {
    const settings = this.getSettings();
    const extractionParent = this.getWorkingTempRoot(settings);
    const environment = await this.getEnvironmentInfo();
    const parsedRecords: StagedSourceRecord[] = [];

    await this.ensureDirectory(extractionParent);

    for (const id of ids) {
      const staged = this.getStagedSource(id);
      if (!staged) {
        continue;
      }

      try {
        let parsedSourceName = staged.detectedName || staged.sourceValue;
        this.updateStagedSource(id, {
          status: "processing",
          errorMessage: null,
          updatedAt: nowIso()
        });

        if (staged.sourceType === "githubRepo") {
          const analysis = await analyzeRemoteSource({
            sourceValue: staged.sourceValue,
            sourceType: staged.sourceType,
            ai: settings.ai,
            environment
          });

          parsedSourceName = analysis.detectedName || staged.sourceValue;
          this.updateStagedSource(id, {
            status: "ready",
            detectedName: analysis.detectedName,
            detectedDescription: analysis.detectedDescription,
            analysisMethod: analysis.analysisMethod,
            analysisSummary: analysis.analysisSummary,
            installStrategy: analysis.installStrategy,
            readmeUrl: analysis.readmeUrl,
            readmeExcerpt: analysis.readmeExcerpt,
            errorMessage: null,
            updatedAt: nowIso()
          });
        } else {
          const archivePath = await this.resolveArchivePath(staged, staged.installStrategy);
          const extractionRoot = path.join(extractionParent, `extract-${id}`);

          await fsp.rm(extractionRoot, { recursive: true, force: true });
          await this.ensureDirectory(extractionRoot);
          await this.extractArchive(archivePath, extractionRoot);

          const parsed = await detectSkillDirectory(extractionRoot);
          parsedSourceName = parsed.name;
          this.updateStagedSource(id, {
            status: "ready",
            detectedName: parsed.name,
            detectedDescription: parsed.description,
            archivePath,
            skillRootPath: parsed.rootPath,
            skillMdPath: parsed.skillMdPath,
            analysisMethod: "rules",
            analysisSummary: "Archive source detected and parsed from SKILL.md.",
            installStrategy: {
              type: "archiveCopy",
              title: "Archive copy install",
              reason: "ZIP sources can be installed by extracting and copying the skill directory.",
              command: null,
              workingDirectory: null,
              manualSteps: [],
              requiredTools: [],
              supportedPlatforms: ["win32", "darwin", "linux"],
              canAutoInstall: true
            },
            readmeUrl: null,
            readmeExcerpt: null,
            errorMessage: null,
            updatedAt: nowIso()
          });
        }

        const refreshed = this.getStagedSource(id);
        if (refreshed) {
          parsedRecords.push(refreshed);
        }

        await this.writeLog("staged", "info", `Parsed source successfully: ${parsedSourceName}`, staged.sourceValue, id);
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
    const environment = await this.getEnvironmentInfo();

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
        if (staged?.installStrategy?.type === "archiveCopy" && staged.status === "ready") {
          try {
            await this.writeLog(
              "install",
              "info",
              "Preparing archive-based installation.",
              staged.sourceValue,
              id
            );
            const archivePath = await this.resolveArchivePath(staged, staged.installStrategy);
            const extractionRoot = path.join(this.getWorkingTempRoot(settings), `install-extract-${id}`);

            await fsp.rm(extractionRoot, { recursive: true, force: true });
            await this.ensureDirectory(extractionRoot);
            await this.writeLog("install", "info", "Extracting downloaded archive.", extractionRoot, id);
            await this.extractArchive(archivePath, extractionRoot);

            const parsed = await detectSkillDirectory(extractionRoot);
            this.updateStagedSource(id, {
              archivePath,
              skillRootPath: parsed.rootPath,
              skillMdPath: parsed.skillMdPath,
              detectedName: staged.detectedName || parsed.name,
              detectedDescription: staged.detectedDescription || parsed.description,
              updatedAt: nowIso()
            });
            staged = this.getStagedSource(id);
          } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown archive preparation error.";
            this.updateStagedSource(id, {
              status: "error",
              errorMessage: message,
              updatedAt: nowIso()
            });
            await this.writeLog("install", "error", "Failed to prepare the archive for installation.", message, id);
            continue;
          }
        }

        if (staged?.installStrategy?.type === "command" || staged?.installStrategy?.type === "manual") {
          try {
            const installedRecord = await this.installUsingStrategy(staged, environment, installRoot, settings.conflictPolicy);
            if (installedRecord) {
              installed.push(installedRecord);
            }
            continue;
          } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown install error.";
            this.updateStagedSource(id, {
              status: "error",
              errorMessage: message,
              updatedAt: nowIso()
            });
            await this.writeLog("install", "error", "Failed to install the staged skill.", message, id);
            continue;
          }
        }

        continue;
      }

      try {
        const slug = slugifySkillName(staged.detectedName || path.basename(staged.skillRootPath));
        const installPath = await this.resolveInstallPath(installRoot, slug, settings.conflictPolicy);
        await this.writeLog(
          "install",
          "info",
          "Installing via archive copy.",
          `${staged.skillRootPath} -> ${installPath}`,
          id
        );

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

  async exportInstalledSkill(input: ExportInstalledSkillInput): Promise<OperationResult<string>> {
    const installed = this.getInstalledSkill(input.skillId);
    if (!installed) {
      return { ok: false, error: "The selected installed skill could not be found." };
    }

    const settings = this.getSettings();
    const targetRoot = resolveSystemProviderSkillPath(input.providerKey, this.paths.homeDir);
    if (!targetRoot) {
      return { ok: false, error: "The selected provider is not supported." };
    }

    const validation = await this.validateDirectory(targetRoot);
    if (!validation.writable) {
      return { ok: false, error: validation.error || "The provider skill directory is not writable." };
    }

    try {
      const exportPath = await this.resolveInstallPath(targetRoot, installed.slug, settings.conflictPolicy);

      if (settings.conflictPolicy === "overwrite") {
        await fsp.rm(exportPath, { recursive: true, force: true });
      }

      await this.ensureDirectory(path.dirname(exportPath));
      await fsp.cp(installed.installPath, exportPath, {
        recursive: true,
        force: false
      });

      await this.writeLog(
        "install",
        "info",
        `Exported installed skill to ${input.providerKey}`,
        exportPath,
        installed.id
      );

      return { ok: true, data: exportPath };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export the installed skill.";
      await this.writeLog("install", "error", "Failed to export the installed skill.", message, installed.id);
      return { ok: false, error: message };
    }
  }

  async saveSettings(input: SaveSettingsInput): Promise<OperationResult<SettingsRecord>> {
    const installDir = input.installDir.trim();
    const tempDir = input.tempDir.trim();
    const projectDirs = [...new Set(input.projectDirs.map((item) => item.trim()).filter(Boolean))];

    if (installDir) {
      const installValidation = await this.validateDirectory(installDir);
      if (!installValidation.writable) {
        return { ok: false, error: installValidation.error || "The install directory is not writable." };
      }
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
          set
            install_dir = ?,
            temp_dir = ?,
            project_dir = ?,
            project_dirs = ?,
            conflict_policy = ?,
            locale = ?,
            ai_provider = ?,
            ai_enabled = ?,
            ai_base_url = ?,
            ai_api_key = ?,
            ai_model = ?,
            updated_at = ?
          where id = 1
        `
      )
      .run(
        installDir,
        tempDir,
        projectDirs[0] || "",
        JSON.stringify(projectDirs),
        input.conflictPolicy,
        input.locale,
        input.ai.provider,
        input.ai.enabled ? 1 : 0,
        input.ai.baseUrl.trim(),
        input.ai.apiKey,
        input.ai.model.trim(),
        nowIso()
      );

    await this.writeLog(
      "settings",
      "info",
      "Saved skill manager settings.",
      `${installDir} | ${tempDir || this.paths.tempRoot} | ${projectDirs.join(" | ") || "(no project imported)"}`,
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

  private async getImportedProjects(projectDirs: string[]): Promise<ImportedProjectRecord[]> {
    const projects = await Promise.all(
      projectDirs.map(async (projectDir) => {
        const sources = await scanWorkspaceSkillSources(projectDir);
        const skillCount = sources.reduce((total, source) => total + source.skillCount, 0);

        return {
          id: projectDir,
          name: path.basename(projectDir) || projectDir,
          path: projectDir,
          skillCount,
          sources
        } satisfies ImportedProjectRecord;
      })
    );

    return projects.sort((left, right) => left.name.localeCompare(right.name));
  }

  private async getSystemSkillSources(): Promise<WorkspaceSkillSource[]> {
    return scanSystemSkillSources();
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
      analysisMethod: null,
      analysisSummary: null,
      installStrategy: null,
      readmeUrl: null,
      readmeExcerpt: null,
      errorMessage: null,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    this.database
      .prepare(
        `
          insert into staged_sources (
            id, source_type, source_value, status, detected_name, detected_description,
            archive_path, skill_root_path, skill_md_path, install_path, analysis_method, analysis_summary,
            install_strategy, readme_url, readme_excerpt, error_message, created_at, updated_at
          ) values (
            @id, @sourceType, @sourceValue, @status, @detectedName, @detectedDescription,
            @archivePath, @skillRootPath, @skillMdPath, @installPath, @analysisMethod, @analysisSummary,
            @installStrategy, @readmeUrl, @readmeExcerpt, @errorMessage, @createdAt, @updatedAt
          )
        `
      )
      .run({
        ...created,
        installStrategy: serializeInstallStrategy(created.installStrategy)
      });

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
        | "analysisMethod"
        | "analysisSummary"
        | "installStrategy"
        | "readmeUrl"
        | "readmeExcerpt"
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
            analysis_method = @analysisMethod,
            analysis_summary = @analysisSummary,
            install_strategy = @installStrategy,
            readme_url = @readmeUrl,
            readme_excerpt = @readmeExcerpt,
            error_message = @errorMessage,
            updated_at = @updatedAt
          where id = @id
        `
      )
      .run({
        id,
        ...rest,
        installStrategy: serializeInstallStrategy(rest.installStrategy || null)
      });
  }

  private async resolveArchivePath(staged: StagedSourceRecord, installStrategy?: InstallStrategy | null) {
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

  private async getEnvironmentInfo() {
    if (!this.environmentCache) {
      this.environmentCache = await detectEnvironment();
    }

    return this.environmentCache;
  }

  private async ensureDirectory(targetPath: string) {
    await fsp.mkdir(targetPath, { recursive: true });
  }

  private async installUsingStrategy(
    staged: StagedSourceRecord,
    environment: EnvironmentInfo,
    installRoot: string,
    conflictPolicy: SettingsRecord["conflictPolicy"]
  ) {
    const strategy = staged.installStrategy;
    if (!strategy) {
      throw new Error("No install strategy is available for this source.");
    }

    if (strategy.type === "manual") {
      throw new Error(
        `Automatic installation is not available. Manual steps:\n${strategy.manualSteps.join("\n") || "Follow the repository README."}`
      );
    }

    if (strategy.type === "command") {
      if (!strategy.command) {
        throw new Error("The detected install command is empty.");
      }

      if (!hasRequiredTools(environment, strategy.requiredTools)) {
        throw new Error(`The required tool is not installed: ${strategy.requiredTools.join(", ")}`);
      }

      const workingDirectory = path.join(this.paths.tempRoot, `command-install-${staged.id}`);
      await fsp.rm(workingDirectory, { recursive: true, force: true });
      await this.ensureDirectory(workingDirectory);
      await this.writeLog(
        "install",
        "info",
        "Installing via command strategy.",
        `${strategy.command} @ ${workingDirectory}`,
        staged.id
      );

      if (staged.sourceType === "githubRepo") {
        const archivePath = await this.resolveArchivePath(staged, strategy);
        await this.writeLog("install", "info", "Downloading repository archive for command install.", archivePath, staged.id);
        await this.extractArchive(archivePath, workingDirectory);
      }

      const commandOutput = await this.runInstallCommand(strategy.command, workingDirectory);
      if (commandOutput.stdout.trim()) {
        await this.writeLog("install", "info", "Install command stdout", commandOutput.stdout.slice(-4000), staged.id);
      }
      if (commandOutput.stderr.trim()) {
        await this.writeLog("install", "warning", "Install command stderr", commandOutput.stderr.slice(-4000), staged.id);
      }
      const parsed = await detectSkillDirectory(workingDirectory);
      const slug = slugifySkillName(staged.detectedName || parsed.name || path.basename(parsed.rootPath));
      const installPath = await this.resolveInstallPath(installRoot, slug, conflictPolicy);
      await this.writeLog(
        "install",
        "info",
        "Copying installed files into the managed skill directory.",
        `${parsed.rootPath} -> ${installPath}`,
        staged.id
      );

      if (conflictPolicy === "overwrite") {
        await fsp.rm(installPath, { recursive: true, force: true });
      }

      await this.ensureDirectory(path.dirname(installPath));
      await fsp.cp(parsed.rootPath, installPath, {
        recursive: true,
        force: false
      });

      const record: InstalledSkillRecord = {
        id: randomUUID(),
        name: staged.detectedName || parsed.name || slug,
        slug,
        description: staged.detectedDescription || parsed.description,
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

      this.updateStagedSource(staged.id, {
        status: "installed",
        installPath,
        errorMessage: null,
        updatedAt: nowIso()
      });

      await this.writeLog("install", "info", `Installed skill: ${record.name}`, installPath, staged.id);
      return record;
    }

    return null;
  }

  private async runInstallCommand(command: string, workingDirectory: string) {
    const shellFile = process.platform === "win32" ? "powershell.exe" : process.env.SHELL || "/bin/sh";
    const shellArgs = process.platform === "win32" ? ["-NoProfile", "-Command", command] : ["-lc", command];

    return execFileAsync(shellFile, shellArgs, {
      cwd: workingDirectory,
      windowsHide: true
    });
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
