export type ConflictPolicy = "skip" | "overwrite" | "rename";
export type SourceType = "localZip" | "githubRepo" | "remoteZip";
export type SourceStatus = "pending" | "processing" | "ready" | "installed" | "error";
export type LogLevel = "info" | "warning" | "error";
export type LogType = "system" | "settings" | "staged" | "install";
export type ThemePreference = "light" | "dark";
export type Locale = "zh-CN" | "en";
export type AiProvider = "deepseek";
export type AnalysisMethod = "rules" | "ai" | "rules+ai";
export type InstallStrategyType = "archiveCopy" | "command" | "manual";

export interface AiSettings {
  enabled: boolean;
  provider: AiProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface DetectedTool {
  name: string;
  available: boolean;
  command: string | null;
}

export interface EnvironmentInfo {
  os: string;
  arch: string;
  shell: string;
  tools: DetectedTool[];
}

export interface InstallStrategy {
  type: InstallStrategyType;
  title: string;
  reason: string | null;
  command: string | null;
  workingDirectory: string | null;
  prerequisiteSteps: string[];
  manualSteps: string[];
  requiredTools: string[];
  supportedPlatforms: string[];
  canAutoInstall: boolean;
}

export interface SettingsRecord {
  installDir: string;
  tempDir: string;
  projectDirs: string[];
  skillCategories: string[];
  defaultSkillCategory: string;
  conflictPolicy: ConflictPolicy;
  theme: ThemePreference;
  locale: Locale;
  ai: AiSettings;
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
  analysisMethod: AnalysisMethod | null;
  analysisSummary: string | null;
  installStrategy: InstallStrategy | null;
  readmeUrl: string | null;
  readmeExcerpt: string | null;
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
  category: string | null;
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

export type WorkspaceSkillProviderKey = "codex" | "claude" | "agents";
export type WorkspaceSkillSourceScope = "project" | "system";
export type WorkspaceTreeNodeKind = "folder" | "skill";

export interface WorkspaceSkillEntry {
  id: string;
  name: string;
  description: string | null;
  relativePath: string;
  rootPath: string;
  skillMdPath: string;
}

export interface WorkspaceTreeNode {
  id: string;
  kind: WorkspaceTreeNodeKind;
  name: string;
  relativePath: string;
  absolutePath: string;
  description: string | null;
  children: WorkspaceTreeNode[];
  skill?: WorkspaceSkillEntry;
}

export interface WorkspaceSkillSource {
  id: string;
  key: WorkspaceSkillProviderKey;
  scope: WorkspaceSkillSourceScope;
  label: string;
  directoryName: string;
  path: string;
  exists: boolean;
  skillCount: number;
  skills: WorkspaceSkillEntry[];
  tree: WorkspaceTreeNode[];
}

export interface ImportedProjectRecord {
  id: string;
  name: string;
  path: string;
  skillCount: number;
  sources: WorkspaceSkillSource[];
  tree: WorkspaceTreeNode[];
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

export interface SkillCategoryRecord {
  id: string;
  name: string;
  path: string;
  skillCount: number;
}

export interface RuntimeInfo {
  isDevelopment: boolean;
  appRoot: string;
  rendererUrl: string;
  dataRoot: string;
  databasePath: string;
  logsRoot: string;
  platform: string;
  homeDir: string;
  environment: EnvironmentInfo;
}

export interface SkillManagerSnapshot {
  settings: SettingsRecord;
  stagedSources: StagedSourceRecord[];
  installedSkills: InstalledSkillRecord[];
  installCategories: SkillCategoryRecord[];
  importedProjects: ImportedProjectRecord[];
  workspaceTree: WorkspaceTreeNode[];
  workspaceSkillSources: WorkspaceSkillSource[];
  systemSkillSources: WorkspaceSkillSource[];
  logs: LogRecord[];
  summary: AppSummary;
  runtime: RuntimeInfo;
}

export interface ExportInstalledSkillInput {
  skillId: string;
  providerKey: WorkspaceSkillProviderKey;
}

export interface InstallWorkspaceSkillInput {
  sourceRoot: string;
  skillRootPath: string;
  providerKey: WorkspaceSkillProviderKey;
}

export interface SaveSettingsInput {
  installDir: string;
  tempDir: string;
  projectDirs: string[];
  skillCategories: string[];
  defaultSkillCategory: string;
  conflictPolicy: ConflictPolicy;
  theme: ThemePreference;
  locale: Locale;
  ai: AiSettings;
}

export interface InstallStagedSourcesInput {
  ids: string[];
  category?: string | null;
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
  installStagedSources(input: InstallStagedSourcesInput): Promise<OperationResult<InstalledSkillRecord[]>>;
  removeStagedSources(ids: string[]): Promise<OperationResult<number>>;
  clearStagedSources(): Promise<OperationResult<number>>;
  getStagedSourceDetail(id: string): Promise<OperationResult<StagedSourceDetail>>;
  getInstalledSkillDetail(id: string): Promise<OperationResult<InstalledSkillDetail>>;
  rescanInstalledSkill(id: string): Promise<OperationResult<InstalledSkillDetail>>;
  exportInstalledSkill(input: ExportInstalledSkillInput): Promise<OperationResult<string>>;
  installWorkspaceSkill(input: InstallWorkspaceSkillInput): Promise<OperationResult<string>>;
  createSkillCategory(name: string): Promise<OperationResult<SkillCategoryRecord>>;
  saveSettings(input: SaveSettingsInput): Promise<OperationResult<SettingsRecord>>;
  validateDirectory(targetPath: string): Promise<DirectoryValidationResult>;
  openPath(targetPath: string): Promise<OperationResult<void>>;
  pickArchiveFile(): Promise<OperationResult<string | null>>;
  pickDirectory(initialPath?: string): Promise<OperationResult<string | null>>;
  getPathForFile?(file: File): string;
}
