import { AlertTriangle, FolderOpen, RefreshCcw, Upload } from "lucide-react";

import type { SkillManagerSnapshot } from "@shared/contracts";

import { SectionCard } from "../ui/cards";
import { OverviewMetric } from "../ui/typography";
import { SyncStatusBadge } from "../ui/badges";

type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;

export function ConflictsSection({
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
  const attentionTargets = snapshot.installedSkills.flatMap((skill) =>
    skill.syncTargets
      .filter((target) => target.status === "local_changes" || target.status === "conflict")
      .map((target) => ({ skill, target }))
  );
  const conflictTargets = attentionTargets.filter(({ target }) => target.status === "conflict").length;
  const localChangeTargets = attentionTargets.filter(({ target }) => target.status === "local_changes").length;
  const term = searchValue.trim().toLowerCase();
  const filteredTargets = attentionTargets.filter(({ skill, target }) => {
    if (!term) {
      return true;
    }

    return (
      skill.name.toLowerCase().includes(term) ||
      skill.slug.toLowerCase().includes(term) ||
      target.label.toLowerCase().includes(term) ||
      target.path.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <SectionCard
        title={t.conflictsOverviewTitle || "冲突与目标改动"}
        subtitle={
          t.conflictsOverviewSubtitle ||
          "这里聚焦需要人工决策的同步目标：要么中心仓库和目标都改了，要么目标目录被手动改动了。"
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <OverviewMetric label={t.conflictsTotalMetric || "待处理目标"} value={attentionTargets.length} />
          <OverviewMetric label={t.conflictsConflictMetric || "双边冲突"} value={conflictTargets} />
          <OverviewMetric label={t.conflictsLocalChangesMetric || "目标被改动"} value={localChangeTargets} />
        </div>
      </SectionCard>

      <SectionCard
        title={t.conflictsListTitle || "需要决策的目标"}
        subtitle={t.conflictsListSubtitle || "你可以选择用中心仓库覆盖目标，也可以反过来采纳目标版本。"}
      >
        <div className="mb-4">
          <input
            className="app-input h-11 w-full rounded-2xl px-4 text-sm"
            onChange={(event) => onSearchValueChange(event.target.value)}
            placeholder={t.conflictsSearchPlaceholder || "搜索技能名、目标名或路径"}
            spellCheck={false}
            value={searchValue}
          />
        </div>

        <div className="space-y-4">
          {filteredTargets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/15 bg-black/5 px-4 py-6 text-sm app-text-soft dark:border-white/15 dark:bg-black/10">
              {attentionTargets.length === 0
                ? t.conflictsEmptyBody || "目前没有需要人工处理的同步冲突或目标改动。"
                : t.conflictsNoResultsBody || "没有匹配当前搜索条件的冲突记录。"}
            </div>
          ) : (
            filteredTargets.map(({ skill, target }) => (
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
                      onClick={() => void onSyncInstalledSkill({ skillId: skill.id, syncTargetId: target.id })}
                      type="button"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      {t.syncOverwriteTargetAction || "覆盖目标"}
                    </button>
                    <button
                      className="app-button"
                      onClick={() => void onAdoptSyncTarget({ syncTargetId: target.id, skillId: skill.id })}
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
      </SectionCard>
    </div>
  );
}
