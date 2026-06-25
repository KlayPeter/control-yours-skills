"use client";

import type {
  DirectoryValidationResult,
  ExportInstalledSkillInput,
  InstalledSkillDetail,
  InstallWorkspaceSkillInput,
  LogRecord,
  OperationResult,
  SettingsRecord,
  SkillManagerApi,
  SkillManagerSnapshot,
  StagedSourceDetail,
  StagedSourceRecord
} from "@shared/contracts";

function nowIso() {
  return new Date().toISOString();
}

const fallbackSettings: SettingsRecord = {
  installDir: "Desktop shell required",
  tempDir: "Desktop shell required",
  projectDirs: [],
  skillCategories: [],
  defaultSkillCategory: "",
  conflictPolicy: "rename",
  theme: "light",
  locale: "en",
  ai: {
    enabled: true,
    provider: "deepseek",
    baseUrl: "https://api.deepseek.com",
    apiKey: "",
    model: "deepseek-v4-pro"
  },
  createdAt: nowIso(),
  updatedAt: nowIso()
};

const fallbackSnapshot: SkillManagerSnapshot = {
  settings: fallbackSettings,
  stagedSources: [],
  installedSkills: [],
  installCategories: [],
  installDirTree: [],
  importedProjects: [],
  workspaceTree: [],
  workspaceSkillSources: [],
  systemSkillSources: [],
  logs: [],
  summary: {
    installedCount: 0,
    stagedCount: 0,
    readyCount: 0,
    failedCount: 0,
    recentFailures: [],
    recentInstalls: []
  },
  runtime: {
    isDevelopment: true,
    appRoot: typeof window === "undefined" ? "" : window.location.origin,
    rendererUrl: typeof window === "undefined" ? "" : window.location.origin,
    dataRoot: "Desktop shell required",
    databasePath: "Desktop shell required",
    logsRoot: "Desktop shell required",
    platform: "unknown",
    homeDir: "Desktop shell required",
    environment: {
      os: "unknown",
      arch: "unknown",
      shell: "unknown",
      tools: []
    }
  }
};

function unavailableResult<T>(
  message = "This page is not running inside the Electron desktop shell."
): OperationResult<T> {
  return {
    ok: false,
    error: message
  };
}

const browserFallbackApi: SkillManagerApi = {
  getSnapshot: async () => fallbackSnapshot,
  importLocalArchive: async () => unavailableResult<StagedSourceRecord>(),
  addRemoteSource: async () => unavailableResult<StagedSourceRecord>(),
  parseStagedSources: async () => unavailableResult<StagedSourceRecord[]>(),
  installStagedSources: async () => unavailableResult(),
  removeStagedSources: async () => ({ ok: true, data: 0 }),
  clearStagedSources: async () => ({ ok: true, data: 0 }),
  getStagedSourceDetail: async () => unavailableResult<StagedSourceDetail>(),
  getInstalledSkillDetail: async () => unavailableResult<InstalledSkillDetail>(),
  rescanInstalledSkill: async () => unavailableResult<InstalledSkillDetail>(),
  exportInstalledSkill: async (_input: ExportInstalledSkillInput) => {
    void _input;
    return unavailableResult<string>();
  },
  installWorkspaceSkill: async (_input: any) => {
    void _input;
    return unavailableResult<any>();
  },
  copyWorkspaceSkillToDirectory: async (_input: any) => {
    void _input;
    return unavailableResult<any>();
  },
  createWorkspaceFolder: async (_input: any) => {
    void _input;
    return unavailableResult<void>();
  },
  createSkillCategory: async () => unavailableResult(),
  saveSettings: async () => unavailableResult<SettingsRecord>(),
  validateDirectory: async (targetPath: string): Promise<DirectoryValidationResult> => ({
    path: targetPath,
    exists: false,
    writable: false,
    created: false,
    error: "This page is not running inside the Electron desktop shell."
  }),
  openPath: async () => unavailableResult<void>(),
  pickArchiveFile: async () => ({ ok: true, data: null }),
  pickDirectory: async () => ({ ok: true, data: null }),
  copySkill: async () => ({ ok: true, data: undefined }),
  moveSkill: async () => ({ ok: true, data: undefined }),
  getPathForFile: (file: File) => (file as unknown as { path?: string }).path || file.name,
  getLastKnownFilePath: () => ""
};

export function getSkillManagerApi() {
  if (typeof window === "undefined") {
    return browserFallbackApi;
  }

  return window.skillManager || browserFallbackApi;
}

export function isDesktopApiAvailable() {
  return typeof window !== "undefined" && Boolean(window.skillManager);
}

export function formatLogLine(log: LogRecord) {
  return `${log.level.toUpperCase()} | ${log.message}`;
}
