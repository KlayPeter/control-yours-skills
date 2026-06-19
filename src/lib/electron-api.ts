"use client";

import type {
  DirectoryValidationResult,
  InstalledSkillDetail,
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
  conflictPolicy: "rename",
  theme: "dark",
  createdAt: nowIso(),
  updatedAt: nowIso()
};

const fallbackSnapshot: SkillManagerSnapshot = {
  settings: fallbackSettings,
  stagedSources: [],
  installedSkills: [],
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
    dataRoot: "Desktop shell required",
    databasePath: "Desktop shell required",
    logsRoot: "Desktop shell required"
  }
};

function unavailableResult<T>(message = "当前页面未运行在 Electron 桌面壳内。"): OperationResult<T> {
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
  saveSettings: async () => unavailableResult<SettingsRecord>(),
  validateDirectory: async (targetPath: string): Promise<DirectoryValidationResult> => ({
    path: targetPath,
    exists: false,
    writable: false,
    created: false,
    error: "当前页面未运行在 Electron 桌面壳内。"
  }),
  openPath: async () => unavailableResult<void>(),
  pickArchiveFile: async () => ({ ok: true, data: null }),
  pickDirectory: async () => ({ ok: true, data: null })
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
  return `${log.level.toUpperCase()} · ${log.message}`;
}
