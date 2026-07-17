import { useState } from "react";
import { AlertTriangle, FolderOpen, RefreshCcw, Sparkles, UploadCloud, Upload } from "lucide-react";

import type {
  ExecuteSyncDecisionInput,
  PreviewSyncInput,
  SkillManagerSnapshot,
  SyncPreview,
  SyncStatus
} from "@shared/contracts";

import { OverviewMetric } from "../ui/typography";
import { SyncStatusBadge } from "../ui/badges";
import { SyncPreviewDialog } from "../workspace/sync-preview-dialog";

type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;

function formatTimestamp(value: string | null, fallback: string) {
  if (!value) {
    return fallback;
  }

  return new Date(value).toLocaleString();
}

function isAttentionStatus(status: SyncStatus) {
  return status === "outdated" || status === "local_changes" || status === "conflict" || status === "sync_failed";
}

export function SyncStatusSection({
  snapshot,
  t,
  searchValue,
  onSearchValueChange,
  onOpenPath,
  onPreviewSync,
  onExecuteSyncDecision
}: {
  snapshot: SkillManagerSnapshot;
  t: TranslationDictionary;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onOpenPath: (path: string) => AsyncActionResult;
  onPreviewSync: (input: PreviewSyncInput) => Promise<SyncPreview | undefined>;
  onExecuteSyncDecision: (input: ExecuteSyncDecisionInput) => AsyncActionResult;
}) {
  const [syncPreview, setSyncPreview] = useState<SyncPreview | null>(null);
  const installedWithTargets = snapshot.installedSkills.filter((skill) => skill.syncTargetCount > 0);
  const allTargets = installedWithTargets.flatMap((skill) =>
    skill.syncTargets.map((target) => ({
      skill,
      target
    }))
  );
  const syncedSkills = installedWithTargets.filter((skill) => skill.syncStatus === "synced").length;
  const attentionSkills = installedWithTargets.filter((skill) => isAttentionStatus(skill.syncStatus)).length;
  const targetChanges = allTargets.filter(
    ({ target }) => target.status === "local_changes" || target.status === "conflict"
  ).length;
  const term = searchValue.trim().toLowerCase();
  const filteredSkills = installedWithTargets.filter((skill) => {
    if (!term) {
      return true;
    }

    return (
      skill.name.toLowerCase().includes(term) ||
      skill.slug.toLowerCase().includes(term) ||
      skill.description?.toLowerCase().includes(term) ||
      skill.syncTargets.some((target) => target.label.toLowerCase().includes(term) || target.path.toLowerCase().includes(term))
    );
  });

  const attentionTargets = installedWithTargets.flatMap((skill) =>
    skill.syncTargets
      .filter((target) => target.status === "local_changes" || target.status === "conflict")
      .map((target) => ({ skill, target }))
  );
  
  const filteredAttentionTargets = attentionTargets.filter(({ skill, target }) => {
    if (!term) return true;
    return (
      skill.name.toLowerCase().includes(term) ||
      skill.slug.toLowerCase().includes(term) ||
      target.label.toLowerCase().includes(term) ||
      target.path.toLowerCase().includes(term)
    );
  });

  const openPreview = async (input: PreviewSyncInput) => {
    try {
      const preview = await onPreviewSync(input);
      if (preview) {
        setSyncPreview(preview);
      }
    } catch {
      // The shared action layer presents the error without opening an empty dialog.
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <p className="text-sm app-text-soft">集中查看并处理所有目标端点的同步状态、失败与冲突。</p>
      </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <OverviewMetric label={t.syncStatusManagedSkillsMetric || "已连接技能"} value={installedWithTargets.length} />
          <OverviewMetric label={t.syncStatusSyncedSkillsMetric || "完全同步"} value={syncedSkills} />
          <OverviewMetric label={t.syncStatusAttentionSkillsMetric || "待处理"} value={attentionSkills} />
          <OverviewMetric label={t.syncStatusConflictTargetsMetric || "目标改动/冲突"} value={targetChanges} />
        </div>
    <div className="space-y-4">
        {attentionTargets.length > 0 && (
          <div className="mb-8 space-y-4">
            <h3 className="text-base font-semibold app-text text-amber-600 dark:text-amber-500">{t.conflictsListTitle || "需要决策的冲突目标"}</h3>
            <div className="space-y-4">
              {filteredAttentionTargets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/15 bg-black/5 px-4 py-6 text-sm app-text-soft dark:border-white/15 dark:bg-black/10">
                  {t.conflictsNoResultsBody || "没有匹配当前搜索条件的冲突记录。"}
                </div>
              ) : (
                filteredAttentionTargets.map(({ skill, target }) => (
                  <div key={target.id} className="rounded-3xl border border-ember/20 bg-ember/5 p-4 dark:border-ember/20 dark:bg-ember/10">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-ember" />
                          <p className="text-sm font-medium app-text">{skill.name}</p>
                          <SyncStatusBadge status={target.status} t={t} />
                        </div>
                        <p className="mt-2 text-xs app-text-soft">
                          {t.conflictsTargetLabel || "目标"}: {target.label}
                        </p>
                        <p className="mt-1 truncate text-xs app-text-soft" title={target.targetSkillPath || target.path}>
                          {target.targetSkillPath || target.path}
                        </p>
                        <p className="mt-2 text-xs text-amber-700 dark:text-amber-200">
                          {target.conflictDetail ||
                            target.lastError ||
                            (target.status === "local_changes"
                              ? t.conflictsLocalChangeHint || "目标目录内容已经变化，中心仓库还是旧版本。"
                              : t.conflictsConflictHint || "中心仓库和目标目录都发生了变化，需要你选择保留哪一边。")}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          className="app-button"
                          onClick={() => void openPreview({ skillId: skill.id, syncTargetId: target.id, direction: "push" })}
                          type="button"
                        >
                          <RefreshCcw className="h-4 w-4" />
                          {t.syncOverwriteTargetAction || "覆盖目标"}
                        </button>
                        <button
                          className="app-button"
                          onClick={() => void openPreview({ skillId: skill.id, syncTargetId: target.id, direction: "adopt" })}
                          type="button"
                        >
                          <Upload className="h-4 w-4" />
                          {t.syncAdoptTargetAction || "采纳目标版本"}
                        </button>
                        <button
                          className="app-icon-button"
                          onClick={() => void onOpenPath(target.targetSkillPath || target.path)}
                          title={t.openFolder}
                          type="button"
                        >
                          <FolderOpen className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold app-text">{t.syncStatusListTitle || "技能发布状态"}</h3>
        </div>
        <div className="mb-4">
          <input
            className="app-input h-11 w-full rounded-2xl px-4 text-sm"
            onChange={(event) => onSearchValueChange(event.target.value)}
            placeholder={t.syncStatusSearchPlaceholder || "搜索技能名、目标名或路径"}
            spellCheck={false}
            value={searchValue}
          />
        </div>

        <div className="space-y-4">
          {filteredSkills.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/15 bg-black/5 px-4 py-6 text-sm app-text-soft dark:border-white/15 dark:bg-black/10">
              {installedWithTargets.length === 0
                ? t.syncStatusEmptyBody || "还没有任何已连接的同步目标。请先去中心仓库给技能绑定同步目标。"
                : t.syncStatusNoResultsBody || "没有匹配当前搜索条件的同步记录。"}
            </div>
          ) : (
            filteredSkills.map((skill) => (
              <div key={skill.id} className="rounded-3xl border border-black/10 bg-white dark:border-white/10 dark:bg-black/40 overflow-hidden shadow-sm">
                {/* Skill Header Section */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/10 dark:border-white/10">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-[12px] bg-gradient-to-br from-amber-500/20 to-orange-500/10 dark:from-amber-400/25 dark:to-orange-500/15 shrink-0 border border-amber-500/30 dark:border-amber-400/30 shadow-sm">
                      <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold app-text">{skill.name}</p>
                      </div>
                      <p className="mt-1 truncate text-xs app-text-soft" title={skill.installPath}>
                        {skill.installPath}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="app-icon-button"
                      onClick={() => void onOpenPath(skill.installPath)}
                      title={t.openFolder}
                      type="button"
                    >
                      <FolderOpen className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Targets Tree Section */}
                <div className="p-4 sm:p-6 bg-white dark:bg-transparent">
                  {skill.syncTargets.length === 0 ? (
                    <div className="text-sm app-text-soft text-center py-4">还没有绑定任何远端目标</div>
                  ) : (
                    <div className="relative border-l-2 border-black/10 dark:border-white/10 ml-4 space-y-6 py-2">
                      {skill.syncTargets.map((target) => (
                        <div key={target.id} className="relative pl-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 group">
                          {/* Commit dot */}
                          <div className="absolute left-[-7px] top-[14px] lg:top-[50%] lg:-translate-y-1/2 w-3 h-3 rounded-full bg-white dark:bg-[#1a1a1a] border-2 border-black/20 dark:border-white/20 group-hover:border-signal transition-colors" />
                          
                          {/* Details */}
                          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-3 lg:gap-6">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium app-text text-sm whitespace-nowrap">{target.label}</span>
                                <span className="rounded border border-black/10 dark:border-white/10 px-1.5 py-0.5 text-[10px] app-text-soft whitespace-nowrap bg-black/5 dark:bg-white/5">
                                  {target.providerKey}
                                </span>
                              </div>
                              <p className="mt-1.5 truncate text-xs app-text-soft font-mono" title={target.targetSkillPath || target.path}>
                                {target.targetSkillPath || target.path}
                              </p>
                              {target.lastError && (
                                <p className="mt-1.5 text-xs text-ember line-clamp-2" title={target.lastError}>{target.lastError}</p>
                              )}
                              {target.conflictDetail && (
                                <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-200 line-clamp-2" title={target.conflictDetail}>{target.conflictDetail}</p>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-1 items-start sm:items-end shrink-0 sm:min-w-[120px]">
                              <SyncStatusBadge status={target.status} t={t} />
                              <p className="text-[10px] app-text-soft mt-1">
                                {formatTimestamp(target.lastSyncedAt, t.syncStatusNeverSynced || "尚未同步")}
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-2 lg:mt-0 shrink-0">
                            <button
                              className="app-button"
                              onClick={() => void openPreview({ skillId: skill.id, syncTargetId: target.id, direction: "push" })}
                              type="button"
                            >
                              <UploadCloud className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">预览推送</span>
                            </button>
                            {target.status === "local_changes" || target.status === "conflict" ? (
                              <button
                                className="app-button bg-signal/10 text-signal hover:bg-signal/20"
                                onClick={() => void openPreview({ skillId: skill.id, syncTargetId: target.id, direction: "adopt" })}
                                type="button"
                              >
                                <Upload className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">预览采纳</span>
                              </button>
                            ) : null}
                            <button
                              className="app-icon-button"
                              onClick={() => void onOpenPath(target.targetSkillPath || target.path)}
                              title={t.openFolder}
                              type="button"
                            >
                              <FolderOpen className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {syncPreview ? (
        <SyncPreviewDialog
          preview={syncPreview}
          onClose={() => setSyncPreview(null)}
          onExecute={onExecuteSyncDecision}
        />
      ) : null}
    </div>
  );
}
