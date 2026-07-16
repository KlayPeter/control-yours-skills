"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  AdoptSyncTargetInput,
  InstallWorkspaceSkillInput,
  CopyWorkspaceSkillInput,
  FolderImportPreviewResult,
  CommitFolderImportInput,
  InstalledSkillDetail,
  Locale,
  SaveSettingsInput,
  SkillManagerSnapshot,
  StagedSourceDetail,
  WorkspaceSkillProviderKey
} from "@shared/contracts";

import { getSkillManagerApi } from "@/lib/electron-api";

const copy: Record<
  Locale,
  {
    failedToLoadSelectedSkill: string;
    failedToLoadSelectedStagedSource: string;
    operationFailed: string;
    busySavingSettings: string;
    busyImportingZip: string;
    busyImportingFolder: string;
    busyAddingRemoteSource: string;
    busyParsingStagedSources: string;
    busyInstallingSkills: string;
    busyRemovingStagedSources: string;
    busyClearingStagingArea: string;
    busyRescanningSkill: string;
    busyExportingSkill: string;
    busyRefreshingWorkspace: string;
    busyInstallingWorkspaceSkill: string;
    busyCopyingWorkspaceSkill: string;
    busyAddingSyncTarget: string;
    busyRemovingSyncTarget: string;
    busySyncingSkill: string;
    busySyncingAllSkills: string;
    busyAdoptingSyncTarget: string;
    busyUpdatingStagedCategory: string;
    busyUpdatingSkillCategory: string;
    settingsSaved: string;
    failedToSaveSettings: string;
    zipImportedAndParsed: string;
    folderImportedAndParsed: string;
    failedToImportZip: string;
    failedToImportFolder: string;
    remoteSourceAddedToStaging: string;
    failedToAddRemoteSource: string;
    stagedSourcesParsed: string;
    failedToParseStagedSources: string;
    stagedSkillsInstalled: string;
    failedToInstallStagedSkills: string;
    stagedSourcesRemoved: string;
    failedToRemoveStagedSources: string;
    stagingAreaCleared: string;
    failedToClearStagingArea: string;
    failedToOpenTargetPath: string;
    skillRescanned: string;
    failedToRescanSkill: string;
    skillExported: string;
    failedToExportSkill: string;
    workspaceSkillInstalled: string;
    failedToInstallWorkspaceSkill: string;
    workspaceSkillCopied: string;
    failedToCopyWorkspaceSkill: string;
    syncTargetAdded: string;
    failedToAddSyncTarget: string;
    syncTargetRemoved: string;
    failedToRemoveSyncTarget: string;
    skillSynced: string;
    failedToSyncSkill: string;
    allSkillsSynced: string;
    failedToSyncAllSkills: string;
    syncTargetAdopted: string;
    failedToAdoptSyncTarget: string;
    stagedCategoryUpdated: string;
    failedToUpdateStagedCategory: string;
    skillCategoryUpdated: string;
    failedToUpdateSkillCategory: string;
  }
> = {
  "zh-CN": {
    failedToLoadSelectedSkill: "加载所选技能失败。",
    failedToLoadSelectedStagedSource: "加载所选暂存来源失败。",
    operationFailed: "操作失败。",
    busySavingSettings: "正在保存设置",
    busyImportingZip: "正在导入 ZIP",
    busyImportingFolder: "正在导入文件夹",
    busyAddingRemoteSource: "正在添加远程来源",
    busyParsingStagedSources: "正在解析暂存来源",
    busyInstallingSkills: "正在安装技能",
    busyRemovingStagedSources: "正在移除暂存来源",
    busyClearingStagingArea: "正在清空暂存区",
    busyRescanningSkill: "正在重新扫描技能",
    busyExportingSkill: "正在导出技能",
    busyRefreshingWorkspace: "正在刷新工作区",
    busyInstallingWorkspaceSkill: "正在安装工作区技能",
    busyCopyingWorkspaceSkill: "正在复制工作区技能",
    busyAddingSyncTarget: "正在添加同步目标",
    busyRemovingSyncTarget: "正在移除同步目标",
    busySyncingSkill: "正在同步技能",
    busySyncingAllSkills: "正在同步全部技能",
    busyAdoptingSyncTarget: "正在采纳目标版本",
    busyUpdatingStagedCategory: "正在更新暂存来源分类",
    busyUpdatingSkillCategory: "正在更新技能分类",
    settingsSaved: "设置已保存。",
    failedToSaveSettings: "保存设置失败。",
    zipImportedAndParsed: "ZIP 已导入并解析。",
    folderImportedAndParsed: "文件夹中的技能已导入暂存区。",
    failedToImportZip: "导入 ZIP 失败。",
    failedToImportFolder: "导入文件夹失败。",
    remoteSourceAddedToStaging: "远程来源已加入暂存区。",
    failedToAddRemoteSource: "添加远程来源失败。",
    stagedSourcesParsed: "暂存来源已解析。",
    failedToParseStagedSources: "解析暂存来源失败。",
    stagedSkillsInstalled: "所选暂存技能已安装。",
    failedToInstallStagedSkills: "安装暂存技能失败。",
    stagedSourcesRemoved: "所选暂存来源已移除。",
    failedToRemoveStagedSources: "移除暂存来源失败。",
    stagingAreaCleared: "暂存区已清空。",
    failedToClearStagingArea: "清空暂存区失败。",
    failedToOpenTargetPath: "打开目标路径失败。",
    skillRescanned: "技能已重新扫描。",
    failedToRescanSkill: "重新扫描所选技能失败。",
    skillExported: "技能已导出到目标目录。",
    failedToExportSkill: "导出技能失败。",
    workspaceSkillInstalled: "工作区技能已安装到系统目录。",
    failedToInstallWorkspaceSkill: "安装工作区技能失败。",
    workspaceSkillCopied: "工作区技能已复制。",
    failedToCopyWorkspaceSkill: "复制工作区技能失败。",
    syncTargetAdded: "同步目标已添加。",
    failedToAddSyncTarget: "添加同步目标失败。",
    syncTargetRemoved: "同步目标已移除。",
    failedToRemoveSyncTarget: "移除同步目标失败。",
    skillSynced: "技能已同步到目标目录。",
    failedToSyncSkill: "同步技能失败。",
    allSkillsSynced: "已完成全部同步。",
    failedToSyncAllSkills: "批量同步失败。",
    syncTargetAdopted: "已采纳目标目录中的版本。",
    failedToAdoptSyncTarget: "采纳目标版本失败。",
    stagedCategoryUpdated: "暂存来源分类已更新。",
    failedToUpdateStagedCategory: "更新暂存来源分类失败。",
    skillCategoryUpdated: "技能分类已更新。",
    failedToUpdateSkillCategory: "更新技能分类失败。"
  },
  en: {
    failedToLoadSelectedSkill: "Failed to load the selected skill.",
    failedToLoadSelectedStagedSource: "Failed to load the selected staged source.",
    operationFailed: "Operation failed.",
    busySavingSettings: "Saving settings",
    busyImportingZip: "Importing ZIP",
    busyImportingFolder: "Importing folder",
    busyAddingRemoteSource: "Adding remote source",
    busyParsingStagedSources: "Parsing staged sources",
    busyInstallingSkills: "Installing skills",
    busyRemovingStagedSources: "Removing staged sources",
    busyClearingStagingArea: "Clearing staging area",
    busyRescanningSkill: "Rescanning skill",
    busyExportingSkill: "Exporting skill",
    busyRefreshingWorkspace: "Refreshing workspace",
    busyInstallingWorkspaceSkill: "Installing workspace skill",
    busyCopyingWorkspaceSkill: "Copying workspace skill",
    busyAddingSyncTarget: "Adding sync target",
    busyRemovingSyncTarget: "Removing sync target",
    busySyncingSkill: "Syncing skill",
    busySyncingAllSkills: "Syncing all skills",
    busyAdoptingSyncTarget: "Adopting target version",
    busyUpdatingStagedCategory: "Updating staged source category",
    busyUpdatingSkillCategory: "Updating skill category",
    settingsSaved: "Settings saved.",
    failedToSaveSettings: "Failed to save settings.",
    zipImportedAndParsed: "ZIP archive imported and parsed.",
    folderImportedAndParsed: "Skill folders imported into staging.",
    failedToImportZip: "Failed to import the ZIP archive.",
    failedToImportFolder: "Failed to import the folder.",
    remoteSourceAddedToStaging: "Remote source added to staging.",
    failedToAddRemoteSource: "Failed to add the remote source.",
    stagedSourcesParsed: "Staged sources parsed.",
    failedToParseStagedSources: "Failed to parse staged sources.",
    stagedSkillsInstalled: "Selected staged skills installed.",
    failedToInstallStagedSkills: "Failed to install staged skills.",
    stagedSourcesRemoved: "Selected staged sources removed.",
    failedToRemoveStagedSources: "Failed to remove staged sources.",
    stagingAreaCleared: "Staging area cleared.",
    failedToClearStagingArea: "Failed to clear the staging area.",
    failedToOpenTargetPath: "Failed to open the target path.",
    skillRescanned: "Skill rescanned.",
    failedToRescanSkill: "Failed to rescan the selected skill.",
    skillExported: "Skill exported to the target directory.",
    failedToExportSkill: "Failed to export the skill.",
    workspaceSkillInstalled: "Workspace skill installed to the system directory.",
    failedToInstallWorkspaceSkill: "Failed to install the workspace skill.",
    workspaceSkillCopied: "Workspace skill copied.",
    failedToCopyWorkspaceSkill: "Failed to copy the workspace skill.",
    syncTargetAdded: "Sync target added.",
    failedToAddSyncTarget: "Failed to add the sync target.",
    syncTargetRemoved: "Sync target removed.",
    failedToRemoveSyncTarget: "Failed to remove the sync target.",
    skillSynced: "Skill synced to its targets.",
    failedToSyncSkill: "Failed to sync the skill.",
    allSkillsSynced: "All skills synced.",
    failedToSyncAllSkills: "Failed to sync all skills.",
    syncTargetAdopted: "Target version adopted into the center repository.",
    failedToAdoptSyncTarget: "Failed to adopt the target version.",
    stagedCategoryUpdated: "Staged source category updated.",
    failedToUpdateStagedCategory: "Failed to update the staged source category.",
    skillCategoryUpdated: "Skill category updated.",
    failedToUpdateSkillCategory: "Failed to update the skill category."
  }
};

let cachedSnapshot: SkillManagerSnapshot | null = null;

export function useSkillManager(initialSkillId?: string) {
  const api = useMemo(() => getSkillManagerApi(), []);
  const [snapshot, setSnapshot] = useState<SkillManagerSnapshot | null>(cachedSnapshot);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(initialSkillId || null);
  const [selectedStagedId, setSelectedStagedId] = useState<string | null>(null);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [selectedWorkspaceSourceId, setSelectedWorkspaceSourceId] = useState<string | null>(null);
  const [selectedSkillDetail, setSelectedSkillDetail] = useState<InstalledSkillDetail | null>(null);
  const [selectedStagedDetail, setSelectedStagedDetail] = useState<StagedSourceDetail | null>(null);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const locale = snapshot?.settings.locale || "zh-CN";
  const t = copy[locale];

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const nextSnapshot = await api.getSnapshot();
      cachedSnapshot = nextSnapshot;
      setSnapshot(nextSnapshot);

      setSelectedWorkspaceSourceId((current) => {
        const allSources = [...nextSnapshot.systemSkillSources, ...nextSnapshot.workspaceSkillSources];
        if (current && allSources.some((source) => source.id === current)) {
          return current;
        }

        return (
          nextSnapshot.workspaceSkillSources.find((source) => source.exists && source.skillCount > 0)?.id ||
          nextSnapshot.workspaceSkillSources.find((source) => source.exists)?.id ||
          nextSnapshot.systemSkillSources.find((source) => source.exists && source.skillCount > 0)?.id ||
          nextSnapshot.systemSkillSources.find((source) => source.exists)?.id ||
          null
        );
      });

      return nextSnapshot;
    } finally {
      setIsRefreshing(false);
    }
  }, [api]);

  const loadSkillDetail = useCallback(
    async (skillId: string | null) => {
      if (!skillId) {
        setSelectedSkillDetail(null);
        return;
      }

      const result = await api.getInstalledSkillDetail(skillId);
      if (result.ok && result.data) {
        setSelectedSkillDetail(result.data);
        setSelectedSkillId(skillId);
      } else {
        setSelectedSkillDetail(null);
        setError(result.error || t.failedToLoadSelectedSkill);
      }
    },
    [api, t.failedToLoadSelectedSkill]
  );

  const loadStagedDetail = useCallback(
    async (stagedId: string | null) => {
      if (!stagedId) {
        setSelectedStagedDetail(null);
        return;
      }

      const result = await api.getStagedSourceDetail(stagedId);
      if (result.ok && result.data) {
        setSelectedStagedDetail(result.data);
        setSelectedStagedId(stagedId);
      } else {
        setSelectedStagedDetail(null);
        setError(result.error || t.failedToLoadSelectedStagedSource);
      }
    },
    [api, t.failedToLoadSelectedStagedSource]
  );

  const runAction = useCallback(
    async <T,>(label: string, action: () => Promise<T>) => {
      setBusyLabel(label);
      setError(null);
      setNotice(null);

      try {
        const result = await action();
        await refresh();

        if (selectedSkillId) {
          await loadSkillDetail(selectedSkillId);
        }

        if (selectedStagedId) {
          await loadStagedDetail(selectedStagedId);
        }

        return result;
      } catch (actionError) {
        const message = actionError instanceof Error ? actionError.message : t.operationFailed;
        setError(message);
        throw actionError;
      } finally {
        setBusyLabel(null);
      }
    },
    [loadSkillDetail, loadStagedDetail, refresh, selectedSkillId, selectedStagedId, t.operationFailed]
  );

  useEffect(() => {
    void (async () => {
      const current = await refresh();
      if (initialSkillId) {
        await loadSkillDetail(initialSkillId);
        return;
      }

      if (current.installedSkills.length > 0) {
        await loadSkillDetail(current.installedSkills[0].id);
      }

      if (current.stagedSources.length > 0) {
        await loadStagedDetail(current.stagedSources[0].id);
      }

      if (current.logs.length > 0) {
        setSelectedLogId(current.logs[0].id);
      }
    })();
  }, [initialSkillId, loadSkillDetail, loadStagedDetail, refresh]);

  return {
    snapshot,
    busyLabel,
    notice,
    error,
    isRefreshing,
    selectedSkillId,
    selectedStagedId,
    selectedLogId,
    selectedWorkspaceSourceId,
    selectedSkillDetail,
    selectedStagedDetail,
    setNotice,
    setError,
    setSelectedLogId,
    setSelectedWorkspaceSourceId,
    clearSelectedStagedDetail: () => {
      setSelectedStagedDetail(null);
      setSelectedStagedId(null);
    },
    refresh,
    loadSkillDetail,
    loadStagedDetail,
    saveSettings: (input: SaveSettingsInput) =>
      runAction(t.busySavingSettings, async () => {
        const result = await api.saveSettings(input);
        if (!result.ok) {
          throw new Error(result.error || t.failedToSaveSettings);
        }

        setNotice(t.settingsSaved);
        return result.data;
      }),
    createSkillCategory: (name: string) =>
      runAction(t.busySavingSettings, async () => {
        const result = await api.createSkillCategory(name);
        if (!result.ok) {
          throw new Error(result.error || t.failedToSaveSettings);
        }

        setNotice(t.settingsSaved);
        return result.data;
      }),
    addSyncTarget: (input: { skillId: string; scope: "project" | "system"; providerKey: WorkspaceSkillProviderKey; label: string; path: string }) =>
      runAction(t.busyAddingSyncTarget, async () => {
        const result = await api.addSyncTarget(input);
        if (!result.ok || !result.data) {
          throw new Error(result.error || t.failedToAddSyncTarget);
        }

        if (selectedSkillId === input.skillId) {
          await loadSkillDetail(input.skillId);
        }

        setNotice(t.syncTargetAdded);
        return result.data;
      }),
    removeSyncTarget: (input: { syncTargetId: string; skillId?: string }) =>
      runAction(t.busyRemovingSyncTarget, async () => {
        const result = await api.removeSyncTarget({ syncTargetId: input.syncTargetId });
        if (!result.ok) {
          throw new Error(result.error || t.failedToRemoveSyncTarget);
        }

        if (input.skillId && selectedSkillId === input.skillId) {
          await loadSkillDetail(input.skillId);
        }

        setNotice(t.syncTargetRemoved);
        return result.data;
      }),
    syncInstalledSkill: (input: { skillId: string; syncTargetId?: string }) =>
      runAction(t.busySyncingSkill, async () => {
        const result = await api.syncInstalledSkill(input);
        if (!result.ok) {
          throw new Error(result.error || t.failedToSyncSkill);
        }

        if (selectedSkillId === input.skillId) {
          await loadSkillDetail(input.skillId);
        }

        setNotice(
          typeof result.data === "number" && result.data > 1
            ? `${t.skillSynced} (${result.data})`
            : t.skillSynced
        );
        return result.data;
      }),
    syncAllSkills: () =>
      runAction(t.busySyncingAllSkills, async () => {
        const result = await api.syncAllSkills();
        if (!result.ok) {
          throw new Error(result.error || t.failedToSyncAllSkills);
        }

        if (selectedSkillId) {
          await loadSkillDetail(selectedSkillId);
        }

        setNotice(
          typeof result.data === "number"
            ? `${t.allSkillsSynced} (${result.data})`
            : t.allSkillsSynced
        );
        return result.data;
      }),
    adoptSyncTarget: (input: AdoptSyncTargetInput & { skillId?: string }) =>
      runAction(t.busyAdoptingSyncTarget, async () => {
        const result = await api.adoptSyncTarget({ syncTargetId: input.syncTargetId });
        if (!result.ok) {
          throw new Error(result.error || t.failedToAdoptSyncTarget);
        }

        if (input.skillId && selectedSkillId === input.skillId) {
          await loadSkillDetail(input.skillId);
        }

        setNotice(t.syncTargetAdopted);
        return result.data;
      }),
    updateStagedSourceCategory: (input: { id: string; category: string | null }) =>
      runAction(t.busyUpdatingStagedCategory, async () => {
        const result = await api.updateStagedSourceCategory(input);
        if (!result.ok || !result.data) {
          throw new Error(result.error || t.failedToUpdateStagedCategory);
        }

        if (selectedStagedId === input.id) {
          await loadStagedDetail(input.id);
        }

        setNotice(t.stagedCategoryUpdated);
        return result.data;
      }),
    updateInstalledSkillCategory: (input: { id: string; category: string | null }) =>
      runAction(t.busyUpdatingSkillCategory, async () => {
        const result = await api.updateInstalledSkillCategory(input);
        if (!result.ok || !result.data) {
          throw new Error(result.error || t.failedToUpdateSkillCategory);
        }

        await loadSkillDetail(input.id);
        setNotice(t.skillCategoryUpdated);
        return result.data;
      }),
    validateDirectory: (targetPath: string) => api.validateDirectory(targetPath),
    importLocalArchive: (filePath: string) =>
      runAction(t.busyImportingZip, async () => {
        const result = await api.importLocalArchive(filePath);
        if (!result.ok) {
          throw new Error(result.error || t.failedToImportZip);
        }

        if (result.data) {
          await loadStagedDetail(result.data.id);
        }

        setNotice(t.zipImportedAndParsed);
        return result.data;
      }),
    importLocalFolder: (folderPath: string) =>
      runAction(t.busyImportingFolder, async () => {
        const result = await api.importLocalFolder(folderPath);
        if (!result.ok || !result.data) {
          throw new Error(result.error || t.failedToImportFolder);
        }

        if (result.data[0]) {
          await loadStagedDetail(result.data[0].id);
        }

        setNotice(
          result.data.length > 1
            ? `${t.folderImportedAndParsed} (${result.data.length})`
            : t.folderImportedAndParsed
        );
        return result.data;
      }),
    previewLocalFolderImport: (folderPath: string) =>
      runAction("正在预览文件夹...", async () => {
        const result = await api.previewLocalFolderImport(folderPath);
        if (!result.ok || !result.data) {
          throw new Error(result.error || t.failedToImportFolder);
        }
        return result.data;
      }),
    commitFolderImport: (input: CommitFolderImportInput) =>
      runAction("正在导入所选项...", async () => {
        const result = await api.commitFolderImport(input);
        if (!result.ok || !result.data) {
          throw new Error(result.error || t.failedToImportFolder);
        }

        if (result.data[0]) {
          await loadStagedDetail(result.data[0].id);
        }

        setNotice(
          result.data.length > 1
            ? `${t.folderImportedAndParsed} (${result.data.length})`
            : t.folderImportedAndParsed
        );
        return result.data;
      }),
    addRemoteSource: (url: string) =>
      runAction(t.busyAddingRemoteSource, async () => {
        const result = await api.addRemoteSource(url);
        if (!result.ok) {
          throw new Error(result.error || t.failedToAddRemoteSource);
        }

        if (result.data) {
          await loadStagedDetail(result.data.id);
        }

        setNotice(t.remoteSourceAddedToStaging);
        return result.data;
      }),
    parseStagedSources: (ids: string[]) =>
      runAction(t.busyParsingStagedSources, async () => {
        const result = await api.parseStagedSources(ids);
        if (!result.ok) {
          throw new Error(result.error || t.failedToParseStagedSources);
        }

        setNotice(t.stagedSourcesParsed);
        return result.data;
      }),
    installStagedSources: (ids: string[], category?: string | null) =>
      runAction(t.busyInstallingSkills, async () => {
        const result = await api.installStagedSources({ ids, category });
        if (!result.ok) {
          throw new Error(result.error || t.failedToInstallStagedSkills);
        }

        if (result.data && result.data.length > 0) {
          await loadSkillDetail(result.data[0].id);
        }

        setNotice(t.stagedSkillsInstalled);
        return result.data;
      }),
    removeStagedSources: (ids: string[]) =>
      runAction(t.busyRemovingStagedSources, async () => {
        const result = await api.removeStagedSources(ids);
        if (!result.ok) {
          throw new Error(result.error || t.failedToRemoveStagedSources);
        }

        setNotice(t.stagedSourcesRemoved);
        return result.data;
      }),
    clearStagedSources: () =>
      runAction(t.busyClearingStagingArea, async () => {
        const result = await api.clearStagedSources();
        if (!result.ok) {
          throw new Error(result.error || t.failedToClearStagingArea);
        }

        setSelectedStagedDetail(null);
        setSelectedStagedId(null);
        setNotice(t.stagingAreaCleared);
        return result.data;
      }),
    openPath: async (targetPath: string) => {
      const result = await api.openPath(targetPath);
      if (!result.ok) {
        setError(result.error || t.failedToOpenTargetPath);
      }

      return result;
    },
    pickArchiveFile: () => api.pickArchiveFile(),
    pickDirectory: (initialPath?: string) => api.pickDirectory(initialPath),
    copySkill: (input: { id: string; targetDir: string }) =>
      runAction("正在复制...", async () => {
        const result = await api.copySkill(input);
        if (!result.ok) throw new Error(result.error || "复制失败");
        setNotice("复制成功");
      }),
    moveSkill: (input: { id: string; targetDir: string }) =>
      runAction("正在移动...", async () => {
        const result = await api.moveSkill(input);
        if (!result.ok) throw new Error(result.error || "移动失败");
        setNotice("移动成功");
      }),
    rescanInstalledSkill: (skillId: string) =>
      runAction(t.busyRescanningSkill, async () => {
        const result = await api.rescanInstalledSkill(skillId);
        if (!result.ok || !result.data) {
          throw new Error(result.error || t.failedToRescanSkill);
        }

        await loadSkillDetail(skillId);
        setNotice(t.skillRescanned);
        return result.data;
      }),
    exportInstalledSkill: (skillId: string, providerKey: WorkspaceSkillProviderKey) =>
      runAction(t.busyExportingSkill, async () => {
        const result = await api.exportInstalledSkill({ skillId, providerKey });
        if (!result.ok) {
          throw new Error(result.error || t.failedToExportSkill);
        }

        setNotice(t.skillExported);
        return result.data;
      }),
    installWorkspaceSkill: (input: InstallWorkspaceSkillInput) =>
      runAction(t.busyInstallingWorkspaceSkill, async () => {
        const result = await api.installWorkspaceSkill(input);
        if (!result.ok) {
          throw new Error(result.error || t.failedToInstallWorkspaceSkill);
        }

        setNotice(t.workspaceSkillInstalled);
        return result.data;
      }),
    copyWorkspaceSkillToDirectory: (input: CopyWorkspaceSkillInput) =>
      runAction(t.busyCopyingWorkspaceSkill, async () => {
        const result = await api.copyWorkspaceSkillToDirectory(input);
        if (!result.ok) {
          throw new Error(result.error || t.failedToCopyWorkspaceSkill);
        }

        setNotice(t.workspaceSkillCopied);
        return result.data;
      }),
    createWorkspaceFolder: (input: { parentPath: string; folderName: string }) =>
      runAction("创建分类文件夹中...", async () => {
        const result = await api.createWorkspaceFolder(input);
        if (!result.ok) {
          throw new Error(result.error || "创建分类文件夹失败");
        }
        await refresh();
      })
  };
}
