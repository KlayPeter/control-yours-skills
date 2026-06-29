import type { SkillManagerSnapshot, WorkspaceSkillSource } from "@shared/contracts";
import { SectionCard } from "../ui/cards";
import { OverviewMetric } from "../ui/typography";
import { ArrowRight, Boxes, FolderPlus, GitBranch, Sparkles } from "lucide-react";

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
  const readyToInstallCount = snapshot.summary.readyCount;

  return (
    <div className="space-y-6">
      <SectionCard
        title={t.overviewExplainTitle || "这是一个 Skill 中控台"}
        subtitle={
          t.overviewExplainSubtitle ||
          "它的目标不是只让你“看到技能”，而是把散落在 ZIP、本地文件夹、项目目录和不同 Agent 里的 Skill 统一纳管、分类，再同步分发出去。"
        }
      >
        <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="app-card p-4">
                <div className="flex items-center gap-2 text-sm font-medium app-text">
                  <Boxes className="h-4 w-4 text-signal" />
                  {t.overviewCapabilityOneTitle || "统一收集 Skill"}
                </div>
                <p className="mt-3 text-sm app-text-soft">
                  {t.overviewCapabilityOneBody || "支持 ZIP、文件夹、远程来源和项目目录，把原本分散的 Skill 统一放进一个工作台。"}
                </p>
              </div>
              <div className="app-card p-4">
                <div className="flex items-center gap-2 text-sm font-medium app-text">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  {t.overviewCapabilityTwoTitle || "分类整理主版本"}
                </div>
                <p className="mt-3 text-sm app-text-soft">
                  {t.overviewCapabilityTwoBody || "中心仓库保存你的正式版本，系统会推荐分类，你也可以手动整理成自己的结构。"}
                </p>
              </div>
              <div className="app-card p-4">
                <div className="flex items-center gap-2 text-sm font-medium app-text">
                  <GitBranch className="h-4 w-4 text-emerald-500" />
                  {t.overviewCapabilityThreeTitle || "同步到多个目标"}
                </div>
                <p className="mt-3 text-sm app-text-soft">
                  {t.overviewCapabilityThreeBody || "把中心仓库里的 Skill 同步到 Codex、Claude、Agents 或项目目录，并持续跟踪状态和冲突。"}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-black/10">
              <div className="flex items-center gap-2 text-sm font-medium app-text">
                <ArrowRight className="h-4 w-4 text-signal" />
                {t.overviewStartTitle || "如果你第一次使用，建议按这条路径开始"}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <button className="app-button justify-start" onClick={onGoLocalInstall} type="button">
                  {t.overviewStartCenterAction || "先看中心仓库"}
                </button>
                <button className="app-button justify-start" onClick={() => void onImportProject()} type="button">
                  <FolderPlus className="h-4 w-4" />
                  {t.overviewStartProjectAction || "导入一个项目"}
                </button>
                <button className="app-button justify-start" onClick={onGoSyncStatus} type="button">
                  {t.overviewStartSyncAction || "再看同步状态"}
                </button>
              </div>
              <p className="mt-4 text-sm app-text-soft">
                {t.overviewStartHint ||
                  "最常见的实际流程是：导入项目或 ZIP -> 安装到中心仓库 -> 调整分类 -> 绑定同步目标 -> 从同步状态页统一分发。"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <OverviewMetric label={t.overviewMetricCenterRepository || "中心仓库技能"} value={centerRepositoryCount} />
            <OverviewMetric label={t.overviewMetricReadyToInstall || "待安装来源"} value={readyToInstallCount} />
            <OverviewMetric label={t.overviewMetricProjectSkills || "项目中识别到的 Skill"} value={importedProjectSkillCount} />
            <OverviewMetric label={t.overviewMetricSyncAttention || "待同步 / 冲突"} value={attentionSkillCount + conflictTargetCount} />
          </div>
        </div>
      </SectionCard>

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
        title={t.workflowOverviewTitle || "你在系统里会怎么使用它"}
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
