import { FolderOpen, RefreshCcw, Upload } from "lucide-react";

import type { SkillManagerSnapshot, SyncStatus } from "@shared/contracts";

import { SectionCard } from "../ui/cards";
import { OverviewMetric } from "../ui/typography";
import { SyncStatusBadge } from "../ui/badges";

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
  onSyncInstalledSkill,
  onAdoptSyncTarget
}: {
  snapshot: SkillManagerSnapshot;
  t: TranslationDictionary;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onOpenPath: (path: string) => AsyncActionResult;
  onSyncInstalledSkill: (input: { skillId: string; syncTargetId?: string }) => AsyncActionResult;
  onAdoptSyncTarget: (input: { syncTargetId: string; skillId?: string }) => AsyncActionResult;
}) {
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

  return (
    <div className="space-y-6">
      <SectionCard
        title={t.syncStatusOverviewTitle || "同步状态总览"}
        subtitle={t.syncStatusOverviewSubtitle || "这里按技能展示中心仓库和各同步目标之间的状态差异。"}
      >
        <div className="grid gap-4 md:grid-cols-4">
          <OverviewMetric label={t.syncStatusManagedSkillsMetric || "已连接技能"} value={installedWithTargets.length} />
          <OverviewMetric label={t.syncStatusSyncedSkillsMetric || "完全同步"} value={syncedSkills} />
          <OverviewMetric label={t.syncStatusAttentionSkillsMetric || "待处理"} value={attentionSkills} />
          <OverviewMetric label={t.syncStatusConflictTargetsMetric || "目标改动/冲突"} value={targetChanges} />
        </div>
      </SectionCard>

      <SectionCard
        title={t.syncStatusListTitle || "技能同步状态"}
        subtitle={t.syncStatusListSubtitle || "每个技能下面会列出它连接的目标、副本状态和可执行操作。"}
      >
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
              <div key={skill.id} className="rounded-3xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-black/10">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium app-text">{skill.name}</p>
                      <SyncStatusBadge status={skill.syncStatus} t={t} />
                    </div>
                    <p className="mt-1 text-xs app-text-soft">{skill.description || t.noDescriptionAvailable}</p>
                    <p className="mt-2 truncate text-xs app-text-soft" title={skill.installPath}>
                      {skill.installPath}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="app-button"
                      onClick={() => void onSyncInstalledSkill({ skillId: skill.id })}
                      type="button"
                    >
                      {t.syncAllTargetsForSkillAction || "同步此技能"}
                    </button>
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

                <div className="mt-4 space-y-3">
                  {skill.syncTargets.map((target) => (
                    <div
                      key={target.id}
                      className="rounded-2xl border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-black/20"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium app-text">{target.label}</p>
                            <SyncStatusBadge status={target.status} t={t} />
                            <span className="rounded-full border border-black/10 px-2 py-0.5 text-[11px] app-text-soft dark:border-white/10">
                              {target.providerKey}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs app-text-soft" title={target.targetSkillPath || target.path}>
                            {target.targetSkillPath || target.path}
                          </p>
                          <p className="mt-2 text-xs app-text-soft">
                            {t.syncStatusLastSyncedLabel || "上次同步"}:{" "}
                            {formatTimestamp(target.lastSyncedAt, t.syncStatusNeverSynced || "尚未同步")}
                          </p>
                          {target.lastError ? (
                            <p className="mt-2 text-xs text-ember">{target.lastError}</p>
                          ) : null}
                          {target.conflictDetail ? (
                            <p className="mt-2 text-xs text-amber-700 dark:text-amber-200">{target.conflictDetail}</p>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            className="app-button"
                            onClick={() => void onSyncInstalledSkill({ skillId: skill.id, syncTargetId: target.id })}
                            type="button"
                          >
                            <RefreshCcw className="h-4 w-4" />
                            {t.syncOverwriteTargetAction || "覆盖目标"}
                          </button>
                          {(target.status === "local_changes" || target.status === "conflict") ? (
                            <button
                              className="app-button"
                              onClick={() => void onAdoptSyncTarget({ syncTargetId: target.id, skillId: skill.id })}
                              type="button"
                            >
                              <Upload className="h-4 w-4" />
                              {t.syncAdoptTargetAction || "采纳目标版本"}
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
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}
