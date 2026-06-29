import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import type Database from "better-sqlite3";
import { dialog, shell } from "electron";
import extractZip from "extract-zip";

import type {
  EnvironmentInfo,
  ExportInstalledSkillInput,
  FolderImportResult,
  ImportedProjectRecord,
  InstallWorkspaceSkillInput,
  CopyWorkspaceSkillInput,
  InstallStagedSourcesInput,
  DirectoryValidationResult,
  InstallStrategy,
  InstalledSkillDetail,
  InstalledSkillRecord,
  LogRecord,
  OperationResult,
  SaveSettingsInput,
  SkillCategoryRecord,
  SettingsRecord,
  SkillManagerSnapshot,
  SyncStatus,
  SyncTargetRecord,
  SourceType,
  StagedSourceDetail,
  StagedSourceRecord,
  WorkspaceSkillSource,
  WorkspaceTreeNode
} from "@shared/contracts";

import { createDatabase } from "./db";
import type { RuntimePaths } from "./runtime-paths";
import { resolveRuntimePaths } from "./runtime-paths";
import { detectEnvironment, hasRequiredTools } from "./utils/environment";
import { analyzeRemoteSource, parseInstallStrategy, requiresArchiveExtraction, serializeInstallStrategy } from "./utils/remote-analysis";
import { classifySkill } from "./utils/skill-classification";
import { detectSkillDirectory, discoverSkillDirectories, slugifySkillName } from "./utils/skill-parser";
import { detectSourceType, resolveGitHubArchiveUrl, validateRemoteSource } from "./utils/source-url";
import {
  resolveSystemProviderSkillPath,
  scanProjectTree,
  scanSystemSkillSources,
  scanWorkspaceSkillSources
} from "./utils/workspace-sources";

const execFileAsync = promisify(execFile);

interface SettingsRow {
  install_dir: string;
  temp_dir: string;
  project_dir: string;
  project_dirs: string;
  skill_categories: string;
  default_skill_category: string;
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
  suggested_category: string | null;
  selected_category: string | null;
  classification_reason: string | null;
  classification_confidence: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface InstalledRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  install_path: string;
  skill_md_path: string;
  source_type: SourceType;
  source_value: string;
  installed_at: string;
  updated_at: string;
}

interface SyncTargetRow {
  id: string;
  skill_id: string;
  target_scope: WorkspaceSkillSource["scope"];
  provider_key: WorkspaceSkillSource["key"];
  label: string;
  path: string;
  status: SyncStatus;
  last_synced_at: string | null;
  last_error: string | null;
  conflict_detail: string | null;
  source_hash: string | null;
  target_hash: string | null;
  last_synced_source_hash: string | null;
  last_synced_target_hash: string | null;
  created_at: string;
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

function parseStringList(raw: string, fallbackValue = "") {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return [...new Set(parsed.map((item) => String(item).trim()).filter(Boolean))];
    }
  } catch {
    // Ignore malformed persisted values and fall back below.
  }

  const legacy = fallbackValue.trim();
  return legacy ? [legacy] : [];
}

function normalizeCategoryName(value: string) {
  return value.trim().replace(/\\+/g, "/").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").replace(/^\/|\/$/g, "");
}

function toSettingsRecord(row: SettingsRow): SettingsRecord {
  return {
    installDir: row.install_dir,
    tempDir: row.temp_dir,
    projectDirs: parseProjectDirs(row.project_dirs, row.project_dir),
    skillCategories: parseStringList(row.skill_categories),
    defaultSkillCategory: row.default_skill_category,
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
    suggestedCategory: row.suggested_category,
    selectedCategory: row.selected_category,
    classificationReason: row.classification_reason,
    classificationConfidence: row.classification_confidence,
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
    category: row.category,
    syncStatus: "managed",
    syncTargetCount: 0,
    syncTargets: [],
    installPath: row.install_path,
    skillMdPath: row.skill_md_path,
    sourceType: row.source_type,
    sourceValue: row.source_value,
    installedAt: row.installed_at,
    updatedAt: row.updated_at
  };
}

function toSyncTargetRecord(row: SyncTargetRow): SyncTargetRecord {
  return {
    id: row.id,
    skillId: row.skill_id,
    scope: row.target_scope,
    providerKey: row.provider_key,
    label: row.label,
    path: row.path,
    status: row.status,
    exists: fs.existsSync(row.path),
    lastSyncedAt: row.last_synced_at,
    lastError: row.last_error,
    conflictDetail: row.conflict_detail,
    createdAt: row.created_at,
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

function toLocalReadmeExcerpt(markdown: string | null) {
  if (!markdown) {
    return null;
  }

  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 10)
    .join("\n")
    .slice(0, 1200);
}

export class SkillManagerBackend {
  readonly paths: RuntimePaths;
  readonly database: Database.Database;
  environmentCache: EnvironmentInfo | null = null;

  async syncPhysicalSkills(installRoot: string) {
    if (!installRoot || !fs.existsSync(installRoot)) return [];
    
    const discoveredSkills: { installPath: string; category: string | null; name: string; description: string | null; slug: string }[] = [];
    const discoveredCategories = new Set<string>();

    const scanDirectory = async (dirPath: string, currentDepth: number, maxDepth: number, parentCategory: string | null) => {
      try {
        const entries = await fsp.readdir(dirPath, { withFileTypes: true });
        
        const isSkill = entries.some(e => e.isFile() && e.name === "SKILL.md");
        if (isSkill) {
          try {
            const parsed = await detectSkillDirectory(dirPath);
            discoveredSkills.push({
              installPath: dirPath,
              category: parentCategory,
              name: parsed.name || path.basename(dirPath),
              description: parsed.description,
              slug: path.basename(dirPath)
            });
          } catch {
            discoveredSkills.push({
              installPath: dirPath,
              category: parentCategory,
              name: path.basename(dirPath),
              description: null,
              slug: path.basename(dirPath)
            });
          }
          return;
        }

        let thisCategory = parentCategory;
        if (currentDepth > 0) {
          thisCategory = parentCategory ? `${parentCategory}/${path.basename(dirPath)}` : path.basename(dirPath);
          discoveredCategories.add(thisCategory);
        }

        if (currentDepth < maxDepth) {
          for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
              const subDir = path.join(dirPath, entry.name);
              await scanDirectory(subDir, currentDepth + 1, maxDepth, thisCategory);
            }
          }
        }
      } catch {}
    };

    await scanDirectory(installRoot, 0, 2, null);

    const existingSkills = this.database.prepare("select * from installed_skills").all() as InstalledRow[];
    const existingMap = new Map(existingSkills.map(s => [s.install_path, s]));

    const insertStmt = this.database.prepare(
      `insert into installed_skills (
        id, name, slug, description, category, install_path, skill_md_path, source_type, source_value, installed_at, updated_at
      ) values (
        @id, @name, @slug, @description, @category, @installPath, @skillMdPath, @sourceType, @sourceValue, @installedAt, @updatedAt
      )`
    );
    const updateStmt = this.database.prepare(
      `update installed_skills set category = @category, name = @name, description = @description where install_path = @installPath`
    );
    const deleteStmt = this.database.prepare("delete from installed_skills where install_path = ?");

    const tx = (this.database as any).transaction(() => {
      for (const skill of discoveredSkills) {
        const existing = existingMap.get(skill.installPath);
        if (existing) {
          updateStmt.run({
            installPath: skill.installPath,
            category: skill.category ?? existing.category,
            name: skill.name,
            description: skill.description
          });
          existingMap.delete(skill.installPath);
        } else {
          insertStmt.run({
            id: randomUUID(),
            name: skill.name,
            slug: skill.slug,
            description: skill.description,
            category: skill.category,
            installPath: skill.installPath,
            skillMdPath: path.join(skill.installPath, "SKILL.md"),
            sourceType: "localDir",
            sourceValue: skill.installPath,
            installedAt: nowIso(),
            updatedAt: nowIso()
          });
        }
      }

      for (const existing of existingMap.values()) {
        if (existing.install_path.startsWith(installRoot) && !fs.existsSync(existing.install_path)) {
          deleteStmt.run(existing.install_path);
        }
      }
    });

    tx();
    return Array.from(discoveredCategories);
  }

  constructor(userDataPath: string) {
    this.paths = resolveRuntimePaths(userDataPath);
    this.database = createDatabase(this.paths);
  }

  async getSnapshot(): Promise<SkillManagerSnapshot> {
    const settings = this.getSettings();
    const environment = await this.getEnvironmentInfo();
    const stagedSources = this.listStagedSources();
    
    // Sync physical folders to DB before fetching installed skills
    await this.syncPhysicalSkills(settings.installDir.trim());

    const installedSkills = this.listInstalledSkills();
    const installCategories = await this.listInstallCategories(settings, installedSkills);
    const installDirTree = settings.installDir && fs.existsSync(settings.installDir) 
      ? await scanProjectTree(settings.installDir, true)
      : [];
    const importedProjects = await this.getImportedProjects(settings.projectDirs);
    const workspaceTree = this.buildWorkspaceTreeFromProjects(importedProjects);
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
      installCategories,
      installDirTree,
      importedProjects,
      workspaceTree,
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

  async importLocalFolder(folderPath: string): Promise<OperationResult<FolderImportResult>> {
    const normalizedFolderPath = folderPath.trim();
    if (!normalizedFolderPath) {
      return { ok: false, error: "Please choose a local folder." };
    }

    const stats = await fsp.stat(normalizedFolderPath).catch(() => null);
    if (!stats?.isDirectory()) {
      return { ok: false, error: "The selected folder does not exist or is not a directory." };
    }

    const discoveredSkills = await discoverSkillDirectories(normalizedFolderPath);
    if (discoveredSkills.length === 0) {
      return { ok: false, error: "No SKILL.md file was found in the selected folder." };
    }

    const existingByPath = new Set(this.listStagedSources().map((item) => item.sourceValue));
    const records: StagedSourceRecord[] = [];
    const skippedPaths: string[] = [];

    for (const skill of discoveredSkills) {
      if (existingByPath.has(skill.rootPath)) {
        skippedPaths.push(skill.rootPath);
        continue;
      }

      const readmeExcerpt = await this.readLocalReadmeExcerpt(skill.rootPath, skill.skillMdPath);
      const classification = classifySkill({
        name: skill.name,
        description: skill.description,
        sourceValue: skill.rootPath,
        skillRootPath: skill.rootPath,
        markdown: skill.markdown,
        readmeExcerpt
      });

      const created = this.insertStagedSource("localFolder", skill.rootPath);
      this.updateStagedSource(created.id, {
        status: "ready",
        detectedName: skill.name,
        detectedDescription: skill.description,
        archivePath: null,
        skillRootPath: skill.rootPath,
        skillMdPath: skill.skillMdPath,
        analysisMethod: "rules",
        analysisSummary: "Local folder skill detected from an existing directory.",
        installStrategy: {
          type: "archiveCopy",
          title: "Folder copy install",
          reason: "This local folder already contains a valid skill and can be copied into the managed repository.",
          command: null,
          workingDirectory: null,
          prerequisiteSteps: [],
          manualSteps: [],
          requiredTools: [],
          supportedPlatforms: ["win32", "darwin", "linux"],
          canAutoInstall: true
        },
        readmeUrl: null,
        readmeExcerpt,
        suggestedCategory: classification.suggestedCategory,
        selectedCategory: null,
        classificationReason: classification.classificationReason,
        classificationConfidence: classification.classificationConfidence,
        errorMessage: null,
        updatedAt: nowIso()
      });

      const refreshed = this.getStagedSource(created.id);
      if (refreshed) {
        records.push(refreshed);
      }
    }

    await this.writeLog(
      "staged",
      "info",
      `Imported local folder with ${records.length} detected skill${records.length === 1 ? "" : "s"}.`,
      normalizedFolderPath,
      null
    );

    return {
      ok: true,
      data: {
        sourcePath: normalizedFolderPath,
        importedCount: records.length,
        skippedCount: skippedPaths.length,
        records,
        skippedPaths
      }
    };
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
          const classification = classifySkill({
            name: analysis.detectedName,
            description: analysis.detectedDescription,
            sourceValue: staged.sourceValue,
            readmeExcerpt: analysis.readmeExcerpt
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
            suggestedCategory: classification.suggestedCategory,
            classificationReason: classification.classificationReason,
            classificationConfidence: classification.classificationConfidence,
            errorMessage: null,
            updatedAt: nowIso()
          });
        } else if (staged.sourceType === "localFolder") {
          const parsed = await detectSkillDirectory(staged.sourceValue);
          const readmeExcerpt = await this.readLocalReadmeExcerpt(parsed.rootPath, parsed.skillMdPath);
          const classification = classifySkill({
            name: parsed.name,
            description: parsed.description,
            sourceValue: staged.sourceValue,
            skillRootPath: parsed.rootPath,
            markdown: parsed.markdown,
            readmeExcerpt
          });
          parsedSourceName = parsed.name;
          this.updateStagedSource(id, {
            status: "ready",
            detectedName: parsed.name,
            detectedDescription: parsed.description,
            archivePath: null,
            skillRootPath: parsed.rootPath,
            skillMdPath: parsed.skillMdPath,
            analysisMethod: "rules",
            analysisSummary: "Local folder source detected and parsed from SKILL.md.",
            installStrategy: {
              type: "archiveCopy",
              title: "Folder copy install",
              reason: "Local folder sources can be installed by copying the skill directory.",
              command: null,
              workingDirectory: null,
              prerequisiteSteps: [],
              manualSteps: [],
              requiredTools: [],
              supportedPlatforms: ["win32", "darwin", "linux"],
              canAutoInstall: true
            },
            readmeUrl: null,
            readmeExcerpt,
            suggestedCategory: classification.suggestedCategory,
            classificationReason: classification.classificationReason,
            classificationConfidence: classification.classificationConfidence,
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
          const readmeExcerpt = await this.readLocalReadmeExcerpt(parsed.rootPath, parsed.skillMdPath);
          const classification = classifySkill({
            name: parsed.name,
            description: parsed.description,
            sourceValue: staged.sourceValue,
            skillRootPath: parsed.rootPath,
            markdown: parsed.markdown,
            readmeExcerpt
          });
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
            prerequisiteSteps: [],
            manualSteps: [],
            requiredTools: [],
            supportedPlatforms: ["win32", "darwin", "linux"],
            canAutoInstall: true
            },
            readmeUrl: null,
            readmeExcerpt,
            suggestedCategory: classification.suggestedCategory,
            classificationReason: classification.classificationReason,
            classificationConfidence: classification.classificationConfidence,
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

  async installStagedSources(input: InstallStagedSourcesInput): Promise<OperationResult<InstalledSkillRecord[]>> {
    const settings = this.getSettings();
    const installRoot = settings.installDir.trim();
    const ids = input.ids;

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

        if (staged?.installStrategy?.type === "manual" || staged?.installStrategy?.type === "command") {
          const message =
            "This remote source was recognized successfully, but remote repositories are metadata-only and cannot be installed automatically. Open the detail view to see the manual installation guide.";
          this.updateStagedSource(id, {
            status: "error",
            errorMessage: message,
            updatedAt: nowIso()
          });
          await this.writeLog("install", "warning", "Automatic install is disabled for remote sources.", message, id);
          continue;
        }

        continue;
      }

      try {
        const resolvedCategory = this.resolveInstallCategory(
          input.category || staged.selectedCategory || staged.suggestedCategory || settings.defaultSkillCategory
        );
        const installBaseDir = resolvedCategory ? path.join(installRoot, resolvedCategory) : installRoot;
        const categoryValidation = await this.validateDirectory(installBaseDir);
        if (!categoryValidation.writable) {
          this.updateStagedSource(id, {
            status: "error",
            errorMessage: categoryValidation.error || "The target category directory is not writable.",
            updatedAt: nowIso()
          });
          await this.writeLog(
            "install",
            "error",
            "Failed to prepare the target category directory.",
            `${resolvedCategory || "(root)"} | ${categoryValidation.error || "Directory is not writable."}`,
            id
          );
          continue;
        }

        const slug = slugifySkillName(staged.detectedName || path.basename(staged.skillRootPath));
        const installPath = await this.resolveInstallPath(installBaseDir, slug, settings.conflictPolicy);
        await this.writeLog(
          "install",
          "info",
          "Installing via archive copy.",
          `${staged.skillRootPath} -> ${installPath} | category: ${resolvedCategory || "(root)"}`,
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
          category: resolvedCategory || null,
          syncStatus: "managed",
          syncTargetCount: 0,
          syncTargets: [],
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
                id, name, slug, description, category, install_path, skill_md_path, source_type, source_value, installed_at, updated_at
              ) values (
                @id, @name, @slug, @description, @category, @installPath, @skillMdPath, @sourceType, @sourceValue, @installedAt, @updatedAt
              )
            `
          )
          .run(record);

        this.database.prepare("delete from staged_sources where id = ?").run(id);

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
    const syncTargets = this.listSyncTargetsBySkill(installed.id);

    return {
      ok: true,
      data: {
        ...installed,
        markdown: await safeReadText(installed.skillMdPath),
        exists,
        syncTargets
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

  async addSyncTarget(input: {
    skillId: string;
    scope: WorkspaceSkillSource["scope"];
    providerKey: WorkspaceSkillSource["key"];
    label: string;
    path: string;
  }): Promise<OperationResult<SyncTargetRecord>> {
    const installed = this.getInstalledSkill(input.skillId);
    if (!installed) {
      return { ok: false, error: "The selected installed skill could not be found." };
    }

    const normalizedPath = path.resolve(input.path.trim());
    if (!normalizedPath) {
      return { ok: false, error: "The sync target path cannot be empty." };
    }

    const existing = this.database
      .prepare("select * from sync_targets where skill_id = ? and path = ?")
      .get(input.skillId, normalizedPath) as SyncTargetRow | undefined;
    if (existing) {
      return { ok: false, error: "This sync target is already connected to the selected skill." };
    }

    const createdAt = nowIso();
    const created: SyncTargetRecord = {
      id: randomUUID(),
      skillId: input.skillId,
      scope: input.scope,
      providerKey: input.providerKey,
      label: input.label.trim() || path.basename(normalizedPath),
      path: normalizedPath,
      status: "managed",
      exists: fs.existsSync(normalizedPath),
      lastSyncedAt: null,
      lastError: null,
      conflictDetail: null,
      createdAt,
      updatedAt: createdAt
    };

    this.database
      .prepare(
        `
          insert into sync_targets (
            id, skill_id, target_scope, provider_key, label, path, status, last_synced_at,
            last_error, conflict_detail, source_hash, target_hash, last_synced_source_hash,
            last_synced_target_hash, created_at, updated_at
          ) values (
            @id, @skillId, @scope, @providerKey, @label, @path, @status, @lastSyncedAt,
            @lastError, @conflictDetail, null, null, null, null, @createdAt, @updatedAt
          )
        `
      )
      .run(created);

    await this.writeLog(
      "settings",
      "info",
      `Added sync target for ${installed.name}`,
      `${created.label} | ${created.path}`,
      installed.id
    );

    const refreshed = this.getSyncTarget(created.id);
    if (!refreshed) {
      return { ok: false, error: "The created sync target could not be reloaded." };
    }

    return { ok: true, data: refreshed };
  }

  async removeSyncTarget(input: { syncTargetId: string }): Promise<OperationResult<number>> {
    const syncTarget = this.getSyncTarget(input.syncTargetId);
    if (!syncTarget) {
      return { ok: true, data: 0 };
    }

    const removed = this.database.prepare("delete from sync_targets where id = ?").run(input.syncTargetId).changes;
    await this.writeLog(
      "settings",
      "info",
      "Removed sync target from installed skill.",
      `${syncTarget.label} | ${syncTarget.path}`,
      syncTarget.skillId
    );

    return { ok: true, data: removed };
  }

  async installWorkspaceSkill(input: InstallWorkspaceSkillInput): Promise<OperationResult<string>> {
    const settings = this.getSettings();
    const targetRoot = resolveSystemProviderSkillPath(input.providerKey, this.paths.homeDir);
    if (!targetRoot) {
      return { ok: false, error: "The selected provider is not supported." };
    }

    const validation = await this.validateDirectory(targetRoot);
    if (!validation.writable) {
      return { ok: false, error: validation.error || "The provider skill directory is not writable." };
    }

    const normalizedSourceRoot = path.resolve(input.sourceRoot);
    const normalizedSkillRoot = path.resolve(input.skillRootPath);
    const relativePath = path.relative(normalizedSourceRoot, normalizedSkillRoot);

    if (
      !relativePath ||
      relativePath.startsWith("..") ||
      path.isAbsolute(relativePath) ||
      !fs.existsSync(path.join(normalizedSkillRoot, "SKILL.md"))
    ) {
      return { ok: false, error: "The selected workspace skill path is invalid." };
    }

    try {
      const metadata = await detectSkillDirectory(normalizedSkillRoot);
      const exportPath = await this.resolveInstallPath(targetRoot, metadata.slug, settings.conflictPolicy);

      if (settings.conflictPolicy === "overwrite") {
        await fsp.rm(exportPath, { recursive: true, force: true });
      }

      await this.ensureDirectory(path.dirname(exportPath));
      await fsp.cp(normalizedSkillRoot, exportPath, {
        recursive: true,
        force: false
      });

      const record: InstalledSkillRecord = {
        id: randomUUID(),
        name: metadata.name,
        slug: metadata.slug,
        description: metadata.description,
        category: null,
        syncStatus: "managed",
        syncTargetCount: 0,
        syncTargets: [],
        installPath: exportPath,
        skillMdPath: path.join(exportPath, "SKILL.md"),
        sourceType: "localZip",
        sourceValue: normalizedSkillRoot,
        installedAt: nowIso(),
        updatedAt: nowIso()
      };

      this.database.prepare("delete from installed_skills where install_path = ?").run(exportPath);
      this.database
        .prepare(
          `
            insert into installed_skills (
              id, name, slug, description, category, install_path, skill_md_path, source_type, source_value, installed_at, updated_at
            ) values (
              @id, @name, @slug, @description, @category, @installPath, @skillMdPath, @sourceType, @sourceValue, @installedAt, @updatedAt
            )
          `
        )
        .run(record);

      await this.writeLog(
        "install",
        "info",
        `Installed workspace skill to ${input.providerKey}`,
        `${normalizedSkillRoot} -> ${exportPath}`,
        record.id
      );

      return { ok: true, data: exportPath };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to install the workspace skill.";
      await this.writeLog("install", "error", "Failed to install the workspace skill.", message, normalizedSkillRoot);
      return { ok: false, error: message };
    }
  }

  async copyWorkspaceSkillToDirectory(input: CopyWorkspaceSkillInput): Promise<OperationResult<string>> {
    const settings = this.getSettings();
    const targetRoot = path.resolve(input.targetDirectory);

    const validation = await this.validateDirectory(targetRoot);
    if (!validation.writable) {
      return { ok: false, error: validation.error || "The target directory is not writable." };
    }

    const normalizedSourceRoot = path.resolve(input.sourceRoot);
    const normalizedSkillRoot = path.resolve(input.skillRootPath);
    const relativePath = path.relative(normalizedSourceRoot, normalizedSkillRoot);

    if (
      !relativePath ||
      relativePath.startsWith("..") ||
      path.isAbsolute(relativePath) ||
      !fs.existsSync(path.join(normalizedSkillRoot, "SKILL.md"))
    ) {
      return { ok: false, error: "The selected workspace skill path is invalid." };
    }

    try {
      const metadata = await detectSkillDirectory(normalizedSkillRoot);
      const exportPath = await this.resolveInstallPath(targetRoot, metadata.slug, settings.conflictPolicy);

      if (settings.conflictPolicy === "overwrite") {
        await fsp.rm(exportPath, { recursive: true, force: true });
      }

      await this.ensureDirectory(path.dirname(exportPath));
      await fsp.cp(normalizedSkillRoot, exportPath, {
        recursive: true,
        force: false
      });

      if (settings.installDir && exportPath.startsWith(settings.installDir)) {
        const record: InstalledSkillRecord = {
          id: randomUUID(),
          name: metadata.name,
          slug: metadata.slug,
          description: metadata.description,
          category: null,
          syncStatus: "managed",
          syncTargetCount: 0,
          syncTargets: [],
          installPath: exportPath,
          skillMdPath: path.join(exportPath, "SKILL.md"),
          sourceType: "localZip",
          sourceValue: normalizedSkillRoot,
          installedAt: nowIso(),
          updatedAt: nowIso()
        };

        this.database.prepare("delete from installed_skills where install_path = ?").run(exportPath);
        this.database
          .prepare(
            `
              insert into installed_skills (
                id, name, slug, description, category, install_path, skill_md_path, source_type, source_value, installed_at, updated_at
              ) values (
                @id, @name, @slug, @description, @category, @installPath, @skillMdPath, @sourceType, @sourceValue, @installedAt, @updatedAt
              )
            `
          )
          .run(record);
      }

      await this.writeLog(
        "install",
        "info",
        `Copied workspace skill to ${targetRoot}`,
        `${normalizedSkillRoot} -> ${exportPath}`,
        null
      );

      return { ok: true, data: exportPath };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to copy the workspace skill.";
      await this.writeLog("install", "error", "Failed to copy the workspace skill.", message, normalizedSkillRoot);
      return { ok: false, error: message };
    }
  }

  async createWorkspaceFolder(input: { parentPath: string; folderName: string }): Promise<OperationResult<void>> {
    try {
      if (!input.folderName.trim()) {
        return { ok: false, error: "Folder name cannot be empty." };
      }
      
      const targetPath = path.join(input.parentPath, input.folderName.trim());
      await fsp.mkdir(targetPath, { recursive: true });
      
      return { ok: true, data: undefined };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create folder.";
      return { ok: false, error: message };
    }
  }

  async createSkillCategory(name: string): Promise<OperationResult<SkillCategoryRecord>> {
    const settings = this.getSettings();
    const installDir = settings.installDir.trim();
    const normalizedName = this.resolveInstallCategory(name);

    if (!installDir) {
      return { ok: false, error: "Please configure a default install directory before creating categories." };
    }

    if (!normalizedName) {
      return { ok: false, error: "Category name cannot be empty." };
    }

    const categoryPath = path.join(installDir, normalizedName);
    const validation = await this.validateDirectory(categoryPath);
    if (!validation.writable) {
      return { ok: false, error: validation.error || "The category directory is not writable." };
    }

    const nextCategories = [...new Set([...settings.skillCategories, normalizedName])];
    await this.persistSettings({
      ...settings,
      skillCategories: nextCategories,
      defaultSkillCategory: settings.defaultSkillCategory || normalizedName
    });

    await this.writeLog("settings", "info", "Created skill category.", categoryPath, null);

    return {
      ok: true,
      data: {
        id: normalizedName,
        name: normalizedName,
        path: categoryPath,
        skillCount: this.listInstalledSkills().filter((skill) => skill.category === normalizedName).length
      }
    };
  }

  async updateInstalledSkillCategory(input: {
    id: string;
    category: string | null;
  }): Promise<OperationResult<InstalledSkillRecord>> {
    const installed = this.getInstalledSkill(input.id);
    if (!installed) {
      return { ok: false, error: "The selected installed skill could not be found." };
    }

    const nextCategory = input.category ? this.resolveInstallCategory(input.category) : null;
    this.database
      .prepare(
        `
          update installed_skills
          set category = ?, updated_at = ?
          where id = ?
        `
      )
      .run(nextCategory, nowIso(), input.id);

    await this.writeLog(
      "settings",
      "info",
      `Updated installed skill category: ${installed.name}`,
      nextCategory || "(uncategorized)",
      installed.id
    );

    const refreshed = this.getInstalledSkill(input.id);
    if (!refreshed) {
      return { ok: false, error: "The updated installed skill could not be reloaded." };
    }

    return { ok: true, data: refreshed };
  }

  async updateStagedSourceCategory(input: {
    id: string;
    category: string | null;
  }): Promise<OperationResult<StagedSourceRecord>> {
    const staged = this.getStagedSource(input.id);
    if (!staged) {
      return { ok: false, error: "The selected staged source could not be found." };
    }

    const nextCategory = input.category ? this.resolveInstallCategory(input.category) : null;
    this.updateStagedSource(input.id, {
      selectedCategory: nextCategory,
      updatedAt: nowIso()
    });

    await this.writeLog(
      "staged",
      "info",
      `Updated staged source category: ${staged.detectedName || staged.sourceValue}`,
      nextCategory || "(follow recommendation)",
      staged.id
    );

    const refreshed = this.getStagedSource(input.id);
    if (!refreshed) {
      return { ok: false, error: "The updated staged source could not be reloaded." };
    }

    return { ok: true, data: refreshed };
  }

  async saveSettings(input: SaveSettingsInput): Promise<OperationResult<SettingsRecord>> {
    const installDir = input.installDir.trim();
    const tempDir = input.tempDir.trim();
    const projectDirs = [...new Set(input.projectDirs.map((item) => item.trim()).filter(Boolean))];
    const skillCategories = [...new Set(input.skillCategories.map((item) => this.resolveInstallCategory(item)).filter(Boolean))];
    const defaultSkillCategory = this.resolveInstallCategory(input.defaultSkillCategory);

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

    if (installDir) {
      for (const category of skillCategories) {
        const categoryValidation = await this.validateDirectory(path.join(installDir, category));
        if (!categoryValidation.writable) {
          return { ok: false, error: categoryValidation.error || `The category directory is not writable: ${category}` };
        }
      }
    }

    await this.persistSettings({
      ...input,
      installDir,
      tempDir,
      projectDirs,
      skillCategories,
      defaultSkillCategory: defaultSkillCategory && skillCategories.includes(defaultSkillCategory) ? defaultSkillCategory : ""
    });

    await this.writeLog(
      "settings",
      "info",
      "Saved skill manager settings.",
      `${installDir} | ${tempDir || this.paths.tempRoot} | ${projectDirs.join(" | ") || "(no project imported)"} | categories: ${skillCategories.join(", ") || "(none)"}`,
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

    return rows.map((row) => this.withSyncMetadata(toInstalledRecord(row)));
  }

  private async listInstallCategories(
    settings: SettingsRecord,
    installedSkills: InstalledSkillRecord[]
  ): Promise<SkillCategoryRecord[]> {
    const installDir = settings.installDir.trim();
    if (!installDir) {
      return [];
    }

    // syncPhysicalSkills is already called in getSnapshot, so we can just read from physical folders again quickly
    // or just rely on what is in the DB now. Actually, let's keep it calling sync to be safe and to get the empty folders.
    const physicalCategories = await this.syncPhysicalSkills(installDir);

    const discovered = new Set([
      ...settings.skillCategories.map((item) => this.resolveInstallCategory(item)).filter(Boolean),
      ...physicalCategories
    ]);

    for (const skill of installedSkills) {
      if (skill.category) {
        discovered.add(skill.category);
      }
    }

    const categories = [...discovered];
    return categories.map((category) => ({
      id: category,
      name: category,
      path: path.join(installDir, category),
      skillCount: installedSkills.filter((skill) => skill.category === category).length
    }));
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
        const tree = await scanProjectTree(projectDir);
        
        let skillCount = 0;
        const countSkills = (nodes: any[]) => {
          for (const node of nodes) {
            if (node.kind === "skill") skillCount++;
            if (node.children) countSkills(node.children);
          }
        };
        countSkills(tree);

        return {
          id: projectDir,
          name: path.basename(projectDir) || projectDir,
          path: projectDir,
          skillCount,
          sources,
          tree
        } satisfies ImportedProjectRecord;
      })
    );

    return projects.sort((left, right) => left.name.localeCompare(right.name));
  }

  private buildWorkspaceTreeFromProjects(projects: ImportedProjectRecord[]): WorkspaceTreeNode[] {
    return projects.map((project) => ({
      id: `workspace-project:${project.id}`,
      kind: "folder",
      name: project.name,
      relativePath: project.name,
      absolutePath: project.path,
      description: null,
      children: project.tree
    }));
  }

  private async getSystemSkillSources(): Promise<WorkspaceSkillSource[]> {
    return scanSystemSkillSources();
  }

  private listSyncTargetsBySkill(skillId: string) {
    const rows = this.database
      .prepare("select * from sync_targets where skill_id = ? order by created_at asc")
      .all(skillId) as SyncTargetRow[];

    return rows.map(toSyncTargetRecord);
  }

  private getSyncTarget(id: string) {
    const row = this.database
      .prepare("select * from sync_targets where id = ?")
      .get(id) as SyncTargetRow | undefined;

    return row ? toSyncTargetRecord(row) : null;
  }

  private getStagedSource(id: string) {
    const row = this.database.prepare("select * from staged_sources where id = ?").get(id) as StagedRow | undefined;
    return row ? toStagedRecord(row) : null;
  }

  private getInstalledSkill(id: string) {
    const row = this.database
      .prepare("select * from installed_skills where id = ?")
      .get(id) as InstalledRow | undefined;

    return row ? this.withSyncMetadata(toInstalledRecord(row)) : null;
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
      suggestedCategory: null,
      selectedCategory: null,
      classificationReason: null,
      classificationConfidence: null,
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
            install_strategy, readme_url, readme_excerpt, suggested_category, selected_category,
            classification_reason, classification_confidence, error_message, created_at, updated_at
          ) values (
            @id, @sourceType, @sourceValue, @status, @detectedName, @detectedDescription,
            @archivePath, @skillRootPath, @skillMdPath, @installPath, @analysisMethod, @analysisSummary,
            @installStrategy, @readmeUrl, @readmeExcerpt, @suggestedCategory, @selectedCategory,
            @classificationReason, @classificationConfidence, @errorMessage, @createdAt, @updatedAt
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
        | "suggestedCategory"
        | "selectedCategory"
        | "classificationReason"
        | "classificationConfidence"
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
            suggested_category = @suggestedCategory,
            selected_category = @selectedCategory,
            classification_reason = @classificationReason,
            classification_confidence = @classificationConfidence,
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

    if (staged.sourceType === "localFolder") {
      if (!fs.existsSync(staged.sourceValue)) {
        throw new Error("The selected skill folder no longer exists on disk.");
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
    await extractZip(archivePath, { dir: destinationPath });
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

  private resolveInstallCategory(value: string) {
    return normalizeCategoryName(value);
  }

  private withSyncMetadata(skill: InstalledSkillRecord): InstalledSkillRecord {
    const syncTargets = this.listSyncTargetsBySkill(skill.id);

    return {
      ...skill,
      syncTargets,
      syncStatus: this.resolveSyncStatus(syncTargets),
      syncTargetCount: syncTargets.length
    };
  }

  private resolveSyncStatus(syncTargets: SyncTargetRecord[]): SyncStatus {
    if (syncTargets.length === 0) {
      return "managed";
    }

    if (syncTargets.some((target) => target.status === "conflict")) {
      return "conflict";
    }

    if (syncTargets.some((target) => target.status === "sync_failed")) {
      return "sync_failed";
    }

    if (syncTargets.some((target) => target.status === "outdated")) {
      return "outdated";
    }

    if (syncTargets.some((target) => target.status === "local_changes")) {
      return "local_changes";
    }

    if (syncTargets.every((target) => target.status === "synced")) {
      return "synced";
    }

    return "managed";
  }

  private async readLocalReadmeExcerpt(skillRootPath: string, skillMdPath: string) {
    const candidates = ["README.md", "readme.md", "README", "README.txt"].map((fileName) =>
      path.join(skillRootPath, fileName)
    );

    for (const candidate of candidates) {
      if (candidate === skillMdPath) {
        continue;
      }

      const content = await safeReadText(candidate);
      const excerpt = toLocalReadmeExcerpt(content);
      if (excerpt) {
        return excerpt;
      }
    }

    return null;
  }

  private async persistSettings(input: SaveSettingsInput) {
    this.database
      .prepare(
        `
          update settings
          set
            install_dir = ?,
            temp_dir = ?,
            project_dir = ?,
            project_dirs = ?,
            skill_categories = ?,
            default_skill_category = ?,
            conflict_policy = ?,
            theme = ?,
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
        input.installDir,
        input.tempDir,
        input.projectDirs[0] || "",
        JSON.stringify(input.projectDirs),
        JSON.stringify(input.skillCategories),
        input.defaultSkillCategory,
        input.conflictPolicy,
        input.theme,
        input.locale,
        input.ai.provider,
        input.ai.enabled ? 1 : 0,
        input.ai.baseUrl.trim(),
        input.ai.apiKey,
        input.ai.model.trim(),
        nowIso()
      );
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
        category: null,
        syncStatus: "managed",
        syncTargetCount: 0,
        syncTargets: [],
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
              id, name, slug, description, category, install_path, skill_md_path, source_type, source_value, installed_at, updated_at
            ) values (
              @id, @name, @slug, @description, @category, @installPath, @skillMdPath, @sourceType, @sourceValue, @installedAt, @updatedAt
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

  async copySkill(input: { id: string; targetDir: string }): Promise<OperationResult<void>> {
    try {
      const skillRow = this.database.prepare("select * from installed_skills where id = ?").get(input.id) as any;
      if (!skillRow) return { ok: false, error: "Skill not found in database." };
      
      const targetPath = path.join(input.targetDir, skillRow.slug);
      if (fs.existsSync(targetPath)) {
        return { ok: false, error: `Target directory already exists: ${targetPath}` };
      }
      
      await fsp.cp(skillRow.install_path, targetPath, { recursive: true });
      await this.writeLog("install", "info", `Copied skill: ${skillRow.name}`, `${skillRow.install_path} -> ${targetPath}`, skillRow.id);
      
      // Sync it so it's registered immediately if it's in the installDir
      const settings = this.getSettings();
      if (targetPath.startsWith(settings.installDir)) {
         await this.syncPhysicalSkills(settings.installDir);
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Failed to copy skill." };
    }
  }

  async moveSkill(input: { id: string; targetDir: string }): Promise<OperationResult<void>> {
    try {
      const skillRow = this.database.prepare("select * from installed_skills where id = ?").get(input.id) as any;
      if (!skillRow) return { ok: false, error: "Skill not found in database." };
      
      const targetPath = path.join(input.targetDir, skillRow.slug);
      if (fs.existsSync(targetPath)) {
        return { ok: false, error: `Target directory already exists: ${targetPath}` };
      }
      
      await fsp.cp(skillRow.install_path, targetPath, { recursive: true });
      await fsp.rm(skillRow.install_path, { recursive: true, force: true });
      
      this.database.prepare("delete from installed_skills where id = ?").run(skillRow.id);
      await this.writeLog("install", "info", `Moved skill: ${skillRow.name}`, `${skillRow.install_path} -> ${targetPath}`, skillRow.id);
      
      // Sync it so it's registered immediately if it's in the installDir
      const settings = this.getSettings();
      if (targetPath.startsWith(settings.installDir)) {
         await this.syncPhysicalSkills(settings.installDir);
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Failed to move skill." };
    }
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
