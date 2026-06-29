import { useState } from "react";
import { Search, FolderPlus, FolderOpen, ArrowRight } from "lucide-react";
import type { SkillManagerSnapshot, WorkspaceSkillProviderKey, WorkspaceTreeNode, CopyWorkspaceSkillInput } from "@shared/contracts";
import { SectionCard } from "../ui/cards";
import { OverviewMetric } from "../ui/typography";
import { SyncStatusBadge } from "../ui/badges";
import { WorkspaceTree } from "../workspace/workspace-tree";

type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;
type InstalledSkillCard = SkillManagerSnapshot["installedSkills"][number];

function describeSkillStatus(skill: InstalledSkillCard, t: TranslationDictionary) {
  switch (skill.syncStatus) {
    case "synced":
      return t.centerRepositoryStatusSyncedHint || "中心仓库和已绑定目标一致。";
    case "outdated":
      return t.centerRepositoryStatusOutdatedHint || "中心仓库有更新，已绑定目标还没跟上。";
    case "local_changes":
      return t.centerRepositoryStatusLocalChangesHint || "某个目标目录被改过了，中心仓库和目标可能不一致。";
    case "conflict":
      return t.centerRepositoryStatusConflictHint || "中心仓库和目标目录都变了，需要去冲突页决策。";
    case "sync_failed":
      return t.centerRepositoryStatusFailedHint || "最近一次同步没有成功，建议检查同步状态。";
    default:
      return t.centerRepositoryStatusManagedHint || "已经纳入中心仓库，但还没有绑定同步目标。";
  }
}

function describeSkillNextStep(skill: InstalledSkillCard, t: TranslationDictionary) {
  if (skill.syncTargetCount === 0) {
    return t.centerRepositoryNextStepBindTarget || "先绑定至少一个同步目标，这个 skill 才能分发出去。";
  }

  if (skill.syncStatus === "outdated") {
    return t.centerRepositoryNextStepSync || "可以直接执行同步，把中心仓库版本推到已绑定目标。";
  }

  if (skill.syncStatus === "local_changes" || skill.syncStatus === "conflict" || skill.syncStatus === "sync_failed") {
    return t.centerRepositoryNextStepReviewChanges || "先去同步状态或冲突页确认差异，再决定覆盖还是采纳目标版本。";
  }

  return t.centerRepositoryNextStepStable || "当前已经稳定，可继续调整分类或绑定更多目标。";
}

function formatPathPreview(path: string) {
  const segments = path.split("/").filter(Boolean);
  if (segments.length <= 4) {
    return path;
  }

  return `.../${segments.slice(-4).join("/")}`;
}

export function LocalInstallSection({
  t,
  snapshot,
  onOpenPath,
  onInstallWorkspaceSkill,
  onCreateWorkspaceFolder,
  onCopyWorkspaceSkill,
  onAddSyncTarget,
  onRemoveSyncTarget,
  onSyncInstalledSkill,
  onSyncAllSkills,
  onUpdateInstalledSkillCategory,
  onGoStaged,
  searchValue,
  onSearchValueChange
}: {
  t: TranslationDictionary;
  snapshot: SkillManagerSnapshot;
  onOpenPath: (path: string) => AsyncActionResult;
  onInstallWorkspaceSkill: (
    sourceRoot: string,
    skillRootPath: string,
    providerKey: WorkspaceSkillProviderKey
  ) => AsyncActionResult;
  onCopyWorkspaceSkill?: (input: CopyWorkspaceSkillInput) => AsyncActionResult;
  onCreateWorkspaceFolder?: (input: { parentPath: string; folderName: string }) => AsyncActionResult;
  onAddSyncTarget: (input: { skillId: string; scope: "project" | "system"; providerKey: WorkspaceSkillProviderKey; label: string; path: string }) => AsyncActionResult;
  onRemoveSyncTarget: (input: { syncTargetId: string; skillId?: string }) => AsyncActionResult;
  onSyncInstalledSkill: (input: { skillId: string; syncTargetId?: string }) => AsyncActionResult;
  onSyncAllSkills: () => AsyncActionResult;
  onUpdateInstalledSkillCategory: (input: { id: string; category: string | null }) => AsyncActionResult;
  onGoStaged: () => AsyncActionResult;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
}) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedSyncTargetPathBySkill, setSelectedSyncTargetPathBySkill] = useState<Record<string, string>>({});
  const installTree = snapshot.installDirTree;

  // Simple search filter function that filters the tree nodes by name
  const filterTree = (nodes: WorkspaceTreeNode[], search: string): WorkspaceTreeNode[] => {
    if (!search) return nodes;
    const lowerSearch = search.toLowerCase();
    
    return nodes.map(node => {
      if (node.kind === 'skill' && node.name.toLowerCase().includes(lowerSearch)) {
        return node;
      }
      if (node.kind === 'folder') {
        const filteredChildren = filterTree(node.children, search);
        if (filteredChildren.length > 0 || node.name.toLowerCase().includes(lowerSearch)) {
          return { ...node, children: filteredChildren };
        }
      }
      return null;
    }).filter((n): n is WorkspaceTreeNode => n !== null);
  };

  const filteredTree = filterTree(installTree, searchValue);
  const filteredInstalledSkills = snapshot.installedSkills.filter((skill) => {
    const term = searchValue.trim().toLowerCase();
    if (!term) {
      return true;
    }

    return (
      skill.name.toLowerCase().includes(term) ||
      skill.slug.toLowerCase().includes(term) ||
      skill.description?.toLowerCase().includes(term) ||
      skill.category?.toLowerCase().includes(term)
    );
  });
  const availableCategories = [...new Set([
    ...snapshot.settings.skillCategories,
    ...snapshot.installCategories.map((category) => category.name)
  ])].sort((left, right) => left.localeCompare(right));
  const categorizedCount = snapshot.installedSkills.filter((skill) => Boolean(skill.category)).length;
  const connectedTargetCount = snapshot.installedSkills.reduce((count, skill) => count + skill.syncTargetCount, 0);
  const syncTargetCandidates = [...snapshot.systemSkillSources, ...snapshot.workspaceSkillSources];
  const syncTargetCandidateMap = new Map(syncTargetCandidates.map((candidate) => [candidate.path, candidate]));
  const sortedInstalledSkills = [...filteredInstalledSkills].sort((left, right) => {
    const leftCategory = left.category || "zzz";
    const rightCategory = right.category || "zzz";
    return leftCategory.localeCompare(rightCategory) || left.name.localeCompare(right.name);
  });
  const groupedInstalledSkills = sortedInstalledSkills.reduce<Array<{ key: string; label: string; skills: typeof sortedInstalledSkills }>>(
    (groups, skill) => {
      const key = skill.category || "__uncategorized__";
      const existingGroup = groups.find((group) => group.key === key);
      if (existingGroup) {
        existingGroup.skills.push(skill);
        return groups;
      }

      groups.push({
        key,
        label: skill.category || t.unclassifiedOption || "未分类",
        skills: [skill]
      });
      return groups;
    },
    []
  );

  return (
    <div className="space-y-6">
      <SectionCard
        title={t.centerRepositoryTitle || "中心仓库总览"}
        subtitle={t.centerRepositorySubtitle || "这里是系统正式纳管的技能主版本库，分类、推荐和后续同步都会以这里为准。"}
        actions={
          <div className="flex flex-wrap gap-2">
            <button className="app-button" onClick={() => void onGoStaged()} type="button">
              <ArrowRight className="h-4 w-4" />
              {t.centerRepositoryAddSourceAction || "前往添加来源"}
            </button>
            <button className="app-button" onClick={() => void onSyncAllSkills()} type="button">
              {t.syncAllSkillsAction || "同步全部"}
            </button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-4">
          <OverviewMetric label={t.sectionSkills || "已纳管技能"} value={snapshot.installedSkills.length} />
          <OverviewMetric label={t.installedMetricCategories || "分类数"} value={availableCategories.length} />
          <OverviewMetric label={t.categorizedSkillsLabel || "已分类"} value={categorizedCount} />
          <OverviewMetric label={t.syncTargetsTitle || "同步目标"} value={connectedTargetCount} />
        </div>
        <div className="mt-4 rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm app-text-soft dark:border-white/10 dark:bg-black/10">
          {t.centerRepositoryFocusHint ||
            "中心仓库页只保留已纳管 Skill 的查看、分类、同步和目录管理。新来源的导入统一放到暂存区。"}
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.16em] app-text-soft">
              {t.centerRepositoryWorkflowPrimary || "1. 先看状态"}
            </p>
            <p className="mt-2 text-sm leading-6 app-text">
              {t.centerRepositoryWorkflowPrimaryBody || "先判断这个 skill 是已同步、待同步，还是目标目录已经发生改动。"}
            </p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.16em] app-text-soft">
              {t.centerRepositoryWorkflowSecondary || "2. 再整理分类"}
            </p>
            <p className="mt-2 text-sm leading-6 app-text">
              {t.centerRepositoryWorkflowSecondaryBody || "分类决定你如何在中心仓库里组织主版本，也方便后面批量浏览。"}
            </p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.16em] app-text-soft">
              {t.centerRepositoryWorkflowTertiary || "3. 最后绑定并分发"}
            </p>
            <p className="mt-2 text-sm leading-6 app-text">
              {t.centerRepositoryWorkflowTertiaryBody || "给 skill 绑定 Codex、Claude、Agents 或项目目录，然后按需同步出去。"}
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 app-text-soft" />
          <input
            type="text"
            placeholder={t.searchPlaceholder || "搜索..."}
            value={searchValue}
            onChange={(e) => onSearchValueChange(e.target.value)}
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/40 pl-10 pr-4 py-2 text-sm app-text focus-visible:ring-2 focus-visible:ring-signal/45 focus-visible:outline-none transition-all"
            spellCheck={false}
          />
        </div>
        {isCreatingFolder ? (
          <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-black/40 rounded-xl border border-black/10 dark:border-white/10 focus-within:border-signal/45 focus-within:ring-1 focus-within:ring-signal/45 transition-all">
            <input
              type="text"
              autoFocus
              className="flex-1 bg-transparent px-2 text-sm app-text focus:outline-none"
              placeholder="分类文件夹名称..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (newFolderName.trim() && onCreateWorkspaceFolder) {
                    void onCreateWorkspaceFolder({ parentPath: snapshot.settings.installDir || "", folderName: newFolderName.trim() });
                    setNewFolderName("");
                    setIsCreatingFolder(false);
                  }
                }
                if (e.key === 'Escape') {
                  setIsCreatingFolder(false);
                  setNewFolderName("");
                }
              }}
            />
            <button 
              className="px-2 py-1 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              onClick={() => {
                if (newFolderName.trim() && onCreateWorkspaceFolder) {
                  void onCreateWorkspaceFolder({ parentPath: snapshot.settings.installDir || "", folderName: newFolderName.trim() });
                  setNewFolderName("");
                  setIsCreatingFolder(false);
                }
              }}
            >
              创建
            </button>
            <button 
              className="px-2 py-1 text-xs font-medium app-text-soft hover:app-text transition-colors"
              onClick={() => { setIsCreatingFolder(false); setNewFolderName(""); }}
            >
              取消
            </button>
          </div>
        ) : (
          <button 
            className="app-button flex items-center gap-2 bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 text-sm"
            onClick={() => setIsCreatingFolder(true)}
          >
            <FolderPlus className="h-4 w-4" />
            新建分类
          </button>
        )}
      </div>

      <SectionCard
        title={t.centerRepositorySkillsTitle || "中心仓库技能"}
        subtitle={t.centerRepositorySkillsSubtitle || "为中心仓库里的技能分配分类，后续推荐分类和同步都会以这里为准。"}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-black/5 px-4 py-3 dark:border-white/10 dark:bg-black/10">
          <div>
            <p className="text-sm font-medium app-text">
              {t.centerRepositoryResultsLabel || "当前展示"}
            </p>
            <p className="mt-1 text-xs app-text-soft">
              {`${snapshot.installedSkills.length} ${t.sectionSkills || "个技能"}，当前匹配 ${sortedInstalledSkills.length} 个。`}
            </p>
          </div>
          <p className="text-xs leading-6 app-text-soft">
            {t.centerRepositorySkillsHelper || "每张卡从上到下依次表示：当前状态、仓库位置、建议下一步，以及分类/同步操作。"}
          </p>
        </div>
        <div className="space-y-6">
          {sortedInstalledSkills.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/15 dark:border-white/15 bg-black/5 dark:bg-black/10 px-4 py-6 text-sm app-text-soft">
              {t.noInstalledSkillsYetDescription || "成功安装后，这里会显示技能。"}
            </div>
          ) : (
            groupedInstalledSkills.map((group) => (
              <div key={group.key} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold app-text">{group.label}</p>
                    <p className="mt-1 text-xs app-text-soft">
                      {`${group.skills.length} ${t.centerRepositoryGroupCountSuffix || "个技能"}`}
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {group.skills.map((skill) => {
                    const availableTargets = syncTargetCandidates.filter(
                      (candidate) => !skill.syncTargets.some((target) => target.path === candidate.path)
                    );

                    return (
                      <div
                        key={skill.id}
                        className="app-surface-subtle rounded-[28px] border border-black/10 p-5 dark:border-white/10"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <SyncStatusBadge status={skill.syncStatus} t={t} />
                              <span className="rounded-full border border-black/10 px-2.5 py-1 text-[11px] app-text-soft dark:border-white/10">
                                {`${skill.syncTargetCount} ${t.syncTargetsCountSuffix || "个目标"}`}
                              </span>
                            </div>
                            <p className="mt-3 truncate text-base font-semibold app-text" title={skill.name}>
                              {skill.name}
                            </p>
                            <p className="mt-1 text-xs app-text-soft">{skill.slug}</p>
                            <p className="mt-3 line-clamp-2 text-sm leading-6 app-text-soft">
                              {skill.description || t.noDescriptionAvailable}
                            </p>
                          </div>
                          <button
                            className="app-button shrink-0"
                            onClick={() => void onOpenPath(skill.installPath)}
                            type="button"
                            title={t.openFolder}
                          >
                            <FolderOpen className="h-4 w-4" />
                            {t.centerRepositoryOpenFolderAction || "打开目录"}
                          </button>
                        </div>

                        <div className="mt-5 grid gap-3">
                          <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                            <p className="text-xs uppercase tracking-[0.16em] app-text-soft">
                              {t.centerRepositoryStatusTitle || "现在状态"}
                            </p>
                            <p className="mt-2 text-sm leading-6 app-text">{describeSkillStatus(skill, t)}</p>
                          </div>
                          <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                            <p className="text-xs uppercase tracking-[0.16em] app-text-soft">
                              {t.centerRepositoryLocationTitle || "仓库位置"}
                            </p>
                            <p className="mt-2 text-sm break-all app-text" title={skill.installPath}>
                              {formatPathPreview(skill.installPath)}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                            <p className="text-xs uppercase tracking-[0.16em] app-text-soft">
                              {t.centerRepositoryNextStepTitle || "建议下一步"}
                            </p>
                            <p className="mt-2 text-sm leading-6 app-text">{describeSkillNextStep(skill, t)}</p>
                          </div>
                        </div>

                        <div className="mt-5 space-y-4">
                          <div className="space-y-2">
                            <label className="block text-xs uppercase tracking-[0.16em] app-text-soft">
                              {t.centerRepositoryCurrentCategoryLabel || "归档分类"}
                            </label>
                            <select
                              className="app-input h-10 w-full rounded-2xl px-3 text-sm"
                              onChange={(event) =>
                                void onUpdateInstalledSkillCategory({
                                  id: skill.id,
                                  category: event.target.value || null
                                })
                              }
                              value={skill.category || ""}
                            >
                              <option value="">{t.unclassifiedOption || "未分类"}</option>
                              {availableCategories.map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
                            <div className="flex items-center justify-between gap-3">
                              <label className="text-xs uppercase tracking-[0.16em] app-text-soft">
                                {t.centerRepositoryConnectedTargetsLabel || "已连接目标"}
                              </label>
                              <span className="text-xs app-text-soft">
                                {`${skill.syncTargetCount} ${t.syncTargetsCountSuffix || "个"}`}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {skill.syncTargets.length === 0 ? (
                                <span className="text-xs app-text-soft">
                                  {t.noSyncTargetsYet || "还没有绑定同步目标。"}
                                </span>
                              ) : (
                                skill.syncTargets.map((syncTarget) => (
                                  <span
                                    key={syncTarget.id}
                                    className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-1 text-xs app-text-soft dark:border-white/10"
                                    title={syncTarget.path}
                                  >
                                    <span>{syncTarget.label}</span>
                                    <button
                                      className="text-[11px] app-text-soft hover:app-text"
                                      onClick={() =>
                                        void onRemoveSyncTarget({ syncTargetId: syncTarget.id, skillId: skill.id })
                                      }
                                      type="button"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))
                              )}
                            </div>
                            <div className="mt-4 flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <select
                                  className="app-input h-10 flex-1 rounded-2xl px-3 text-sm"
                                  onChange={(event) =>
                                    setSelectedSyncTargetPathBySkill((current) => ({
                                      ...current,
                                      [skill.id]: event.target.value
                                    }))
                                  }
                                  value={selectedSyncTargetPathBySkill[skill.id] || ""}
                                >
                                  <option value="">{t.addSyncTargetPlaceholder || "选择一个同步目标目录"}</option>
                                  {availableTargets.map((candidate) => (
                                    <option key={candidate.id} value={candidate.path}>
                                      {candidate.label}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  className="app-button"
                                  onClick={() => {
                                    const targetPath = selectedSyncTargetPathBySkill[skill.id];
                                    const candidate = targetPath ? syncTargetCandidateMap.get(targetPath) : undefined;
                                    if (!candidate) {
                                      return;
                                    }

                                    void onAddSyncTarget({
                                      skillId: skill.id,
                                      scope: candidate.scope,
                                      providerKey: candidate.key,
                                      label: candidate.label,
                                      path: candidate.path
                                    });
                                    setSelectedSyncTargetPathBySkill((current) => ({
                                      ...current,
                                      [skill.id]: ""
                                    }));
                                  }}
                                  type="button"
                                >
                                  {t.addSyncTargetAction || "添加"}
                                </button>
                              </div>
                              {availableTargets.length === 0 ? (
                                <p className="text-xs app-text-soft">
                                  {t.centerRepositoryNoAvailableTarget || "没有可新增的同步目标。"}
                                </p>
                              ) : null}
                              <button
                                className="app-button"
                                disabled={skill.syncTargetCount === 0}
                                onClick={() => void onSyncInstalledSkill({ skillId: skill.id })}
                                type="button"
                              >
                                {t.syncNowAction || "立即同步"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard 
        title={t.localInstallDirectory || "中心仓库目录"} 
        subtitle={t.localInstallDirectorySubtitle || "查看和管理中心仓库在磁盘上的真实目录结构"}
      >
        <div className="mt-4">
          <WorkspaceTree
            nodes={filteredTree}
            projectRoot={snapshot.settings.installDir || ""}
            onOpenPath={onOpenPath}
            onInstallWorkspaceSkill={onInstallWorkspaceSkill}
            onCopyWorkspaceSkill={onCopyWorkspaceSkill}
            importedProjects={snapshot.importedProjects}
            emptyMessage={t.projectTreeEmpty || "没有找到可安装的技能"}
          />
        </div>
      </SectionCard>
    </div>
  );
}
