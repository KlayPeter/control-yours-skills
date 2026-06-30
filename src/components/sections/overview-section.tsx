import type { SkillManagerSnapshot, WorkspaceSkillSource } from "@shared/contracts";
import { ArrowRight, Boxes, FolderPlus, GitBranch, Inbox, Sparkles } from "lucide-react";

import { SectionCard } from "../ui/cards";
import { OverviewMetric } from "../ui/typography";
import { OverviewStatsGrid } from "./overview/OverviewStatsGrid";
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
  onGoAiWorkspace,
  onGoLocalInstall,
  onGoProjects,
  onGoSyncStatus
}: {
  snapshot: SkillManagerSnapshot;
  installPathConfigured: boolean;
  t: TranslationDictionary;
  onChooseInstallDir: () => AsyncActionResult;
  onGoImport: () => AsyncActionResult;
  onGoStaged: () => AsyncActionResult;
  onOpenSystemSourceModal: (source: WorkspaceSkillSource) => void;
  onImportProject: () => AsyncActionResult;
  onGoAiWorkspace: () => void;
  onGoLocalInstall: () => void;
  onGoProjects: () => void;
  onGoSyncStatus: () => void;
}) {
  const centerRepositoryCount = snapshot.installedSkills.length;
  const importedProjectSkillCount = snapshot.importedProjects.reduce(
    (total, project) => total + countSkillsInTree(project.tree),
    0
  );
  const uncategorizedCount = snapshot.installedSkills.filter((skill) => !skill.category).length;
  const attentionSkillCount = snapshot.installedSkills.filter(
    (skill) => skill.syncTargetCount > 0 && skill.syncStatus !== "synced"
  ).length;
  const conflictTargetCount = snapshot.installedSkills.flatMap((skill) =>
    skill.syncTargets.filter((target) => target.status === "conflict" || target.status === "local_changes")
  ).length;
  const readyToInstallCount = snapshot.summary.readyCount;
  const primarySystemSource = snapshot.systemSkillSources.find((source) => source.exists) || null;

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

      <SectionCard
        title={t.overviewGuideTitle || "这个系统到底是干什么的"}
        subtitle={
          t.overviewGuideSubtitle ||
          "一句话理解：先把 Skill 收进中心仓库做主版本，再按分类整理，最后同步到不同 Agent 或项目目录。"
        }
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-black/10 bg-black/5 p-5 dark:border-white/10 dark:bg-black/10">
            <div className="flex items-center gap-2 text-sm font-medium app-text">
              <ArrowRight className="h-4 w-4 text-signal" />
              {t.overviewStartTitle || "建议你这样开始"}
            </div>
            <p className="mt-3 text-sm app-text-soft">
              {t.overviewStartHint ||
                "最常见的实际流程是：导入项目或 ZIP -> 安装到中心仓库 -> 调整分类 -> 绑定同步目标 -> 从同步状态页统一分发。"}
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="app-card p-4">
                <div className="flex items-center gap-2 text-sm font-medium app-text">
                  <FolderPlus className="h-4 w-4 text-amber-500" />
                  {t.overviewStepImportTitle || "第一步：接入来源"}
                </div>
                <p className="mt-3 text-sm app-text-soft">
                  {t.overviewStepImportBody || "先导入一个项目、ZIP 或本地文件夹，让系统开始识别 Skill。"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="app-button" onClick={() => void onImportProject()} type="button">
                    {t.importProjectAction || t.importProject}
                  </button>
                  <button className="app-button" onClick={onGoImport} type="button">
                    {t.quickStartGoImport || "前往导入"}
                  </button>
                </div>
              </div>

              <div className="app-card p-4">
                <div className="flex items-center gap-2 text-sm font-medium app-text">
                  <Boxes className="h-4 w-4 text-signal" />
                  {t.overviewStepRepositoryTitle || "第二步：纳入中心仓库"}
                </div>
                <p className="mt-3 text-sm app-text-soft">
                  {t.overviewStepRepositoryBody || "中心仓库保存正式版本。安装完成后，你可以在这里继续分类、整理和查看目录结构。"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="app-button" onClick={onGoLocalInstall} type="button">
                    {t.sectionLocalInstall}
                  </button>
                  {!installPathConfigured ? (
                    <button className="app-button" onClick={onChooseInstallDir} type="button">
                      {t.quickStartChooseInstallDir}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="app-card p-4">
                <div className="flex items-center gap-2 text-sm font-medium app-text">
                  <GitBranch className="h-4 w-4 text-emerald-500" />
                  {t.overviewStepSyncTitle || "第三步：同步与分发"}
                </div>
                <p className="mt-3 text-sm app-text-soft">
                  {t.overviewStepSyncBody || "当中心仓库里的 Skill 稳定后，把它同步到 Codex、Claude、Agents 或你的项目目录。"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="app-button" onClick={onGoSyncStatus} type="button">
                    {t.sectionSyncStatus}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={t.overviewPagesTitle || "几个主要页面分别负责什么"}
        subtitle={
          t.overviewPagesSubtitle ||
          "如果你忘了某个页面该做什么，可以把这里当作产品导航图。"
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="app-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium app-text">
              <Boxes className="h-4 w-4 text-signal" />
              {t.sectionLocalInstall}
            </div>
            <p className="mt-3 text-sm app-text-soft">
              {t.overviewPageCenterLongBody || "这是你的主版本库。这里最适合做分类、整理目录、连接同步目标。"}
            </p>
            <button className="mt-4 app-button" onClick={onGoLocalInstall} type="button">
              {t.sectionLocalInstall}
            </button>
          </div>

          <div className="app-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium app-text">
              <FolderPlus className="h-4 w-4 text-amber-500" />
              {t.sectionProjects}
            </div>
            <p className="mt-3 text-sm app-text-soft">
              {t.overviewPageProjectsLongBody || "把你自己的项目接进来，扫描项目里已经存在的 Skill，并决定是否纳管。"}
            </p>
            <button className="mt-4 app-button" onClick={onGoProjects} type="button">
              {t.sectionProjects}
            </button>
          </div>

          <div className="app-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium app-text">
              <Inbox className="h-4 w-4 text-rose-500" />
              {t.sectionStaged}
            </div>
            <p className="mt-3 text-sm app-text-soft">
              {t.overviewPageStagedLongBody || "导入的新来源会先出现在这里，适合查看解析结果、确认后再安装。"}
            </p>
            <button className="mt-4 app-button" onClick={onGoStaged} type="button">
              {t.sectionStaged}
            </button>
          </div>

          <div className="app-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium app-text">
              <GitBranch className="h-4 w-4 text-emerald-500" />
              {t.sectionSyncStatus}
            </div>
            <p className="mt-3 text-sm app-text-soft">
              {t.overviewPageSyncLongBody || "当你已经有中心仓库内容后，这里负责查看待同步、失败和冲突。"}
            </p>
            <button className="mt-4 app-button" onClick={onGoSyncStatus} type="button">
              {t.sectionSyncStatus}
            </button>
          </div>

          <div className="app-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium app-text">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              {t.sectionAiWorkspace}
            </div>
            <p className="mt-3 text-sm app-text-soft">
              {t.overviewPageAiLongBody || "这里用来查看系统里原本就存在的 Codex、Claude、Agents Skill 来源。"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="app-button" onClick={onGoAiWorkspace} type="button">
                {t.sectionAiWorkspace}
              </button>
              {primarySystemSource ? (
                <button
                  className="app-button"
                  onClick={() => onOpenSystemSourceModal(primarySystemSource)}
                  type="button"
                >
                  {t.view}
                </button>
              ) : null}
            </div>
          </div>
        </div>


      </SectionCard>
    </div>
  );
}
