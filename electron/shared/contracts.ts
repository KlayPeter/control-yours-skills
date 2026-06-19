export type ConflictPolicy = "skip" | "overwrite" | "rename";
export type SourceType = "localZip" | "githubRepo" | "remoteZip";
export type SourceStatus = "pending" | "processing" | "ready" | "installed" | "error";
export type LogLevel = "info" | "warning" | "error";
export type LogType = "system" | "settings" | "staged" | "install";
export type ThemePreference = "dark";

export interface SettingsRecord {
  installDir: string;
  tempDir: string;
  conflictPolicy: ConflictPolicy;
  theme: ThemePreference;
  createdAt: string;
  updatedAt: string;
}

export interface DirectoryValidationResult {
  path: string;
  exists: boolean;
  writable: boolean;
  created: boolean;
  error?: string;
}

export interface StagedSourceRecord {
  id: string;
  sourceType: SourceType;
  sourceValue: string;
  status: SourceStatus;
  detectedName: string | null;
  detectedDescription: string | null;
  archivePath: string | null;
  skillRootPath: string | null;
  skillMdPath: string | null;
  installPath: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StagedSourceDetail extends StagedSourceRecord {
  markdown: string | null;
}

export interface InstalledSkillRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  installPath: string;
  skillMdPath: string;
  sourceType: SourceType;
  sourceValue: string;
  installedAt: string;
  updatedAt: string;
}

export interface InstalledSkillDetail extends InstalledSkillRecord {
  markdown: string | null;
  exists: boolean;
}

export type WorkspaceSkillProviderKey = "codex" | "claude" | "agent" | "agents";

export interface WorkspaceSkillEntry {
  id: string;
  name: string;
  description: string | null;
  relativePath: string;
  rootPath: string;
  skillMdPath: string;
}

export interface WorkspaceSkillSource {
  key: WorkspaceSkillProviderKey;
  label: string;
  directoryName: string;
  path: string;
  exists: boolean;
  skillCount: number;
  skills: WorkspaceSkillEntry[];
}

export interface LogRecord {
  id: string;
  type: LogType;
  level: LogLevel;
  message: string;
  detail: string | null;
  relatedId: string | null;
  createdAt: string;
}

export interface AppSummary {
  installedCount: number;
  stagedCount: number;
  readyCount: number;
  failedCount: number;
  recentInstalls: InstalledSkillRecord[];
  recentFailures: LogRecord[];
}

export interface RuntimeInfo {
  isDevelopment: boolean;
  appRoot: string;
  dataRoot: string;
  databasePath: string;
  logsRoot: string;
}

export interface SkillManagerSnapshot {
  settings: SettingsRecord;
  stagedSources: StagedSourceRecord[];
  installedSkills: InstalledSkillRecord[];
  workspaceSkillSources: WorkspaceSkillSource[];
  logs: LogRecord[];
  summary: AppSummary;
  runtime: RuntimeInfo;
}

export interface SaveSettingsInput {
  installDir: string;
  tempDir: string;
  conflictPolicy: ConflictPolicy;
}

export interface OperationResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface SkillManagerApi {
  getSnapshot(): Promise<SkillManagerSnapshot>;
  importLocalArchive(filePath: string): Promise<OperationResult<StagedSourceRecord>>;
  addRemoteSource(url: string): Promise<OperationResult<StagedSourceRecord>>;
  parseStagedSources(ids: string[]): Promise<OperationResult<StagedSourceRecord[]>>;
  installStagedSources(ids: string[]): Promise<OperationResult<InstalledSkillRecord[]>>;
  removeStagedSources(ids: string[]): Promise<OperationResult<number>>;
  clearStagedSources(): Promise<OperationResult<number>>;
  getStagedSourceDetail(id: string): Promise<OperationResult<StagedSourceDetail>>;
  getInstalledSkillDetail(id: string): Promise<OperationResult<InstalledSkillDetail>>;
  rescanInstalledSkill(id: string): Promise<OperationResult<InstalledSkillDetail>>;
  saveSettings(input: SaveSettingsInput): Promise<OperationResult<SettingsRecord>>;
  validateDirectory(targetPath: string): Promise<DirectoryValidationResult>;
  openPath(targetPath: string): Promise<OperationResult<void>>;
  pickArchiveFile(): Promise<OperationResult<string | null>>;
  pickDirectory(initialPath?: string): Promise<OperationResult<string | null>>;
}
