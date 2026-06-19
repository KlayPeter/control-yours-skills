"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  InstalledSkillDetail,
  SaveSettingsInput,
  SkillManagerSnapshot,
  StagedSourceDetail
} from "@shared/contracts";

import { getSkillManagerApi } from "@/lib/electron-api";

export function useSkillManager(initialSkillId?: string) {
  const api = useMemo(() => getSkillManagerApi(), []);
  const [snapshot, setSnapshot] = useState<SkillManagerSnapshot | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(initialSkillId || null);
  const [selectedStagedId, setSelectedStagedId] = useState<string | null>(null);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [selectedSkillDetail, setSelectedSkillDetail] = useState<InstalledSkillDetail | null>(null);
  const [selectedStagedDetail, setSelectedStagedDetail] = useState<StagedSourceDetail | null>(null);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const nextSnapshot = await api.getSnapshot();
    setSnapshot(nextSnapshot);
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
        setError(result.error || "读取 Skill 详情失败。");
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
        setError(result.error || "读取暂存项详情失败。");
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
        const message = actionError instanceof Error ? actionError.message : "操作失败。";
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
    selectedSkillDetail,
    selectedStagedDetail,
    setNotice,
    setError,
    setSelectedLogId,
    refresh,
    loadSkillDetail,
    loadStagedDetail,
    saveSettings: (input: SaveSettingsInput) =>
      runAction("保存设置", async () => {
        const result = await api.saveSettings(input);
        if (!result.ok) {
          throw new Error(result.error || "保存设置失败。");
        }

        setNotice("设置已保存。");
        return result.data;
      }),
    validateDirectory: (targetPath: string) => api.validateDirectory(targetPath),
    importLocalArchive: (filePath: string) =>
      runAction("导入 ZIP", async () => {
        const result = await api.importLocalArchive(filePath);
        if (!result.ok) {
          throw new Error(result.error || "导入 ZIP 失败。");
        }

        if (result.data) {
          await loadStagedDetail(result.data.id);
        }
        setNotice("ZIP 已导入并完成基础识别。");
        return result.data;
      }),
    addRemoteSource: (url: string) =>
      runAction("加入远程来源", async () => {
        const result = await api.addRemoteSource(url);
        if (!result.ok) {
          throw new Error(result.error || "加入暂存区失败。");
        }

        if (result.data) {
          await loadStagedDetail(result.data.id);
        }
        setNotice("远程来源已加入暂存区。");
        return result.data;
      }),
    parseStagedSources: (ids: string[]) =>
      runAction("解析暂存项", async () => {
        const result = await api.parseStagedSources(ids);
        if (!result.ok) {
          throw new Error(result.error || "解析暂存项失败。");
        }

        setNotice("暂存项解析完成。");
        return result.data;
      }),
    installStagedSources: (ids: string[]) =>
      runAction("安装 Skill", async () => {
        const result = await api.installStagedSources(ids);
        if (!result.ok) {
          throw new Error(result.error || "安装 Skill 失败。");
        }

        if (result.data && result.data.length > 0) {
          await loadSkillDetail(result.data[0].id);
        }
        setNotice("所选暂存项已执行安装。");
        return result.data;
      }),
    removeStagedSources: (ids: string[]) =>
      runAction("删除暂存项", async () => {
        const result = await api.removeStagedSources(ids);
        if (!result.ok) {
          throw new Error(result.error || "删除暂存项失败。");
        }

        setNotice("已删除所选暂存项。");
        return result.data;
      }),
    clearStagedSources: () =>
      runAction("清空暂存区", async () => {
        const result = await api.clearStagedSources();
        if (!result.ok) {
          throw new Error(result.error || "清空暂存区失败。");
        }

        setSelectedStagedDetail(null);
        setSelectedStagedId(null);
        setNotice("暂存区已清空。");
        return result.data;
      }),
    openPath: async (targetPath: string) => {
      const result = await api.openPath(targetPath);
      if (!result.ok) {
        setError(result.error || "打开目录失败。");
      }
      return result;
    },
    pickArchiveFile: async () => api.pickArchiveFile(),
    pickDirectory: async (initialPath?: string) => api.pickDirectory(initialPath),
    rescanInstalledSkill: (skillId: string) =>
      runAction("重新扫描 Skill", async () => {
        const result = await api.rescanInstalledSkill(skillId);
        if (!result.ok || !result.data) {
          throw new Error(result.error || "重新扫描失败。");
        }

        await loadSkillDetail(skillId);
        setNotice("Skill 信息已重新扫描。");
        return result.data;
      })
  };
}
