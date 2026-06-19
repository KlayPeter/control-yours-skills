"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  InstalledSkillDetail,
  SaveSettingsInput,
  SkillManagerSnapshot,
  StagedSourceDetail,
  WorkspaceSkillProviderKey
} from "@shared/contracts";

import { getSkillManagerApi } from "@/lib/electron-api";

export function useSkillManager(initialSkillId?: string) {
  const api = useMemo(() => getSkillManagerApi(), []);
  const [snapshot, setSnapshot] = useState<SkillManagerSnapshot | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(initialSkillId || null);
  const [selectedStagedId, setSelectedStagedId] = useState<string | null>(null);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [selectedWorkspaceSourceKey, setSelectedWorkspaceSourceKey] =
    useState<WorkspaceSkillProviderKey | null>(null);
  const [selectedSkillDetail, setSelectedSkillDetail] = useState<InstalledSkillDetail | null>(null);
  const [selectedStagedDetail, setSelectedStagedDetail] = useState<StagedSourceDetail | null>(null);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const nextSnapshot = await api.getSnapshot();
    setSnapshot(nextSnapshot);

    setSelectedWorkspaceSourceKey((current) => {
      if (current && nextSnapshot.workspaceSkillSources.some((source) => source.key === current)) {
        return current;
      }

      return (
        nextSnapshot.workspaceSkillSources.find((source) => source.exists && source.skillCount > 0)?.key ||
        nextSnapshot.workspaceSkillSources.find((source) => source.exists)?.key ||
        null
      );
    });

    return nextSnapshot;
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
        setError(result.error || "Failed to load the selected skill.");
      }
    },
    [api]
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
        setError(result.error || "Failed to load the selected staged source.");
      }
    },
    [api]
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
        const message = actionError instanceof Error ? actionError.message : "Operation failed.";
        setError(message);
        throw actionError;
      } finally {
        setBusyLabel(null);
      }
    },
    [loadSkillDetail, loadStagedDetail, refresh, selectedSkillId, selectedStagedId]
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
    selectedSkillId,
    selectedStagedId,
    selectedLogId,
    selectedWorkspaceSourceKey,
    selectedSkillDetail,
    selectedStagedDetail,
    setNotice,
    setError,
    setSelectedLogId,
    setSelectedWorkspaceSourceKey,
    refresh,
    loadSkillDetail,
    loadStagedDetail,
    saveSettings: (input: SaveSettingsInput) =>
      runAction("Saving settings", async () => {
        const result = await api.saveSettings(input);
        if (!result.ok) {
          throw new Error(result.error || "Failed to save settings.");
        }

        setNotice("Settings saved.");
        return result.data;
      }),
    validateDirectory: (targetPath: string) => api.validateDirectory(targetPath),
    importLocalArchive: (filePath: string) =>
      runAction("Importing ZIP", async () => {
        const result = await api.importLocalArchive(filePath);
        if (!result.ok) {
          throw new Error(result.error || "Failed to import the ZIP archive.");
        }

        if (result.data) {
          await loadStagedDetail(result.data.id);
        }

        setNotice("ZIP archive imported and parsed.");
        return result.data;
      }),
    addRemoteSource: (url: string) =>
      runAction("Adding remote source", async () => {
        const result = await api.addRemoteSource(url);
        if (!result.ok) {
          throw new Error(result.error || "Failed to add the remote source.");
        }

        if (result.data) {
          await loadStagedDetail(result.data.id);
        }

        setNotice("Remote source added to staging.");
        return result.data;
      }),
    parseStagedSources: (ids: string[]) =>
      runAction("Parsing staged sources", async () => {
        const result = await api.parseStagedSources(ids);
        if (!result.ok) {
          throw new Error(result.error || "Failed to parse staged sources.");
        }

        setNotice("Staged sources parsed.");
        return result.data;
      }),
    installStagedSources: (ids: string[]) =>
      runAction("Installing skills", async () => {
        const result = await api.installStagedSources(ids);
        if (!result.ok) {
          throw new Error(result.error || "Failed to install staged skills.");
        }

        if (result.data && result.data.length > 0) {
          await loadSkillDetail(result.data[0].id);
        }

        setNotice("Selected staged skills installed.");
        return result.data;
      }),
    removeStagedSources: (ids: string[]) =>
      runAction("Removing staged sources", async () => {
        const result = await api.removeStagedSources(ids);
        if (!result.ok) {
          throw new Error(result.error || "Failed to remove staged sources.");
        }

        setNotice("Selected staged sources removed.");
        return result.data;
      }),
    clearStagedSources: () =>
      runAction("Clearing staging area", async () => {
        const result = await api.clearStagedSources();
        if (!result.ok) {
          throw new Error(result.error || "Failed to clear the staging area.");
        }

        setSelectedStagedDetail(null);
        setSelectedStagedId(null);
        setNotice("Staging area cleared.");
        return result.data;
      }),
    openPath: async (targetPath: string) => {
      const result = await api.openPath(targetPath);
      if (!result.ok) {
        setError(result.error || "Failed to open the target path.");
      }

      return result;
    },
    pickArchiveFile: async () => api.pickArchiveFile(),
    pickDirectory: async (initialPath?: string) => api.pickDirectory(initialPath),
    rescanInstalledSkill: (skillId: string) =>
      runAction("Rescanning skill", async () => {
        const result = await api.rescanInstalledSkill(skillId);
        if (!result.ok || !result.data) {
          throw new Error(result.error || "Failed to rescan the selected skill.");
        }

        await loadSkillDetail(skillId);
        setNotice("Skill rescanned.");
        return result.data;
      })
  };
}
