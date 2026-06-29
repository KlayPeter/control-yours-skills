import type { SkillManagerSnapshot, WorkspaceSkillSource } from "@shared/contracts";
import { SectionCard } from "../ui/cards";
import { OverviewMetric } from "../ui/typography";

import { CapabilityGrid } from "./overview/CapabilityGrid";
import { OverviewStatsGrid } from "./overview/OverviewStatsGrid";
import { RecentFailures } from "./overview/RecentFailures";
import { countSkillsInTree } from "@/lib/tree-utils";

type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;

export function OverviewSection({
  snapshot,
  installPathConfigured,
  t,
  onChooseInstallDir,
  onGoImport,
  onGoStaged,
  onOpenSystemSourceModal,
  onImportProject,
  onOpenPath,
  onOpenLogsFromOverview,
  onGoAiWorkspace,
  onGoLocalInstall,
  onGoProjects,
  onGoSyncStatus,
  onGoConflicts
}: {
  snapshot: SkillManagerSnapshot;
  installPathConfigured: boolean;
  t: TranslationDictionary;
  onChooseInstallDir: () => AsyncActionResult;
  onGoImport: () => AsyncActionResult;
  onGoStaged: () => AsyncActionResult;
  onOpenSystemSourceModal: (source: WorkspaceSkillSource) => void;
  onImportProject: () => AsyncActionResult;
  onOpenPath: (path: string) => AsyncActionResult;
  onOpenLogsFromOverview: (logId: string) => void;
  onGoAiWorkspace: () => void;
  onGoLocalInstall: () => void;
  onGoProjects: () => void;
  onGoSyncStatus: () => void;
  onGoConflicts: () => void;
}) {
  const systemSkillCount = snapshot.systemSkillSources.reduce((total, source) => total + source.skillCount, 0);
  const detectedSystemSources = snapshot.systemSkillSources.filter((source) => source.exists).length;
  const importedProjectCount = snapshot.importedProjects.length;
  const importedProjectSkillCount = snapshot.importedProjects.reduce((total, project) => total + countSkillsInTree(project.tree), 0);
  const centerRepositoryCount = snapshot.installedSkills.length;
  const uncategorizedCount = snapshot.installedSkills.filter((skill) => !skill.category).length;
  const attentionSkillCount = snapshot.installedSkills.filter(
    (skill) => skill.syncTargetCount > 0 && skill.syncStatus !== "synced"
  ).length;
  const conflictTargetCount = snapshot.installedSkills.flatMap((skill) =>
    skill.syncTargets.filter((target) => target.status === "conflict" || target.status === "local_changes")
  ).length;

  return (
    <div className="space-y-6">
      <OverviewStatsGrid
        snapshot={snapshot}
        t={t}
        onGoAiWorkspace={onGoAiWorkspace}
        onGoLocalInstall={onGoLocalInstall}
        onGoProjects={onGoProjects}
        onGoStaged={onGoStaged}
      />

      <SectionCard title={t.capabilityOverviewTitle} subtitle={t.capabilityOverviewSubtitle}>
        <CapabilityGrid
          snapshot={snapshot}
          t={t}
          installPathConfigured={installPathConfigured}
          onChooseInstallDir={onChooseInstallDir}
          onOpenPath={onOpenPath}
          onGoImport={onGoImport}
          onGoStaged={onGoStaged}
          onOpenSystemSourceModal={onOpenSystemSourceModal}
          onImportProject={onImportProject}
          systemSkillCount={systemSkillCount}
          detectedSystemSources={detectedSystemSources}
          importedProjectCount={importedProjectCount}
          importedProjectSkillCount={importedProjectSkillCount}
        />
      </SectionCard>

      <SectionCard
        title={t.workflowOverviewTitle || "现在系统的主线"}
        subtitle={
          t.workflowOverviewSubtitle ||
          "先把 Skill 纳入中心仓库，再整理分类，最后把稳定版本同步到不同 Agent 或项目目录。"
        }
      >
        <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="app-card p-4">
              <p className="text-xs uppercase tracking-[0.16em] app-text-soft">
                {t.workflowStepOneLabel || "Step 1"}
              </p>
              <p className="mt-3 text-base font-semibold app-text">
                {t.workflowCenterRepositoryTitle || "中心仓库是主版本"}
              </p>
              <p className="mt-2 text-sm app-text-soft">
                {t.workflowCenterRepositoryBody ||
                  "导入、安装后的 Skill 都先进入中心仓库，后续分类、同步和状态判断都以这里为准。"}
              </p>
              <button className="mt-4 app-button" onClick={onGoLocalInstall} type="button">
                {t.workflowCenterRepositoryAction || "打开中心仓库"}
              </button>
            </div>

            <div className="app-card p-4">
              <p className="text-xs uppercase tracking-[0.16em] app-text-soft">
                {t.workflowStepTwoLabel || "Step 2"}
              </p>
              <p className="mt-3 text-base font-semibold app-text">
                {t.workflowCategoriesTitle || "分类帮助你管理 Skill"}
              </p>
              <p className="mt-2 text-sm app-text-soft">
                {t.workflowCategoriesBody ||
                  "系统会给出推荐分类，你也可以手动调整成“图片相关”“编程相关”等业务上更顺手的结构。"}
              </p>
              <div className="mt-4 text-xs app-text-soft">
                {t.workflowCategoriesFootnote || "当前未分类技能"}: {uncategorizedCount}
              </div>
            </div>

            <div className="app-card p-4">
              <p className="text-xs uppercase tracking-[0.16em] app-text-soft">
                {t.workflowStepThreeLabel || "Step 3"}
              </p>
              <p className="mt-3 text-base font-semibold app-text">
                {t.workflowSyncTitle || "同步页负责分发和诊断"}
              </p>
              <p className="mt-2 text-sm app-text-soft">
                {t.workflowSyncBody ||
                  "当中心仓库更新后，你可以一键同步到 Codex、Claude、Agents 或项目目录，并检查哪里过期、哪里冲突。"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="app-button" onClick={onGoSyncStatus} type="button">
                  {t.workflowSyncStatusAction || "查看同步状态"}
                </button>
                <button className="app-button" onClick={onGoConflicts} type="button">
                  {t.workflowConflictsAction || "查看冲突"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <OverviewMetric label={t.workflowCenterRepositoryMetric || "中心仓库技能"} value={centerRepositoryCount} />
            <OverviewMetric label={t.workflowSyncAttentionMetric || "待同步技能"} value={attentionSkillCount} />
            <OverviewMetric label={t.workflowConflictsMetric || "冲突/目标改动"} value={conflictTargetCount} />
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6">
        <SectionCard title={t.recentFailures} subtitle={t.recentFailuresSubtitle}>
          <RecentFailures
            snapshot={snapshot}
            t={t}
            onOpenLogsFromOverview={onOpenLogsFromOverview}
          />
        </SectionCard>
      </div>
    </div>
  );
}
