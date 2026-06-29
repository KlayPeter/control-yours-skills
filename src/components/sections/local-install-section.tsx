import { useState } from "react";
import type { DropzoneState } from "react-dropzone";
import { Search, UploadCloud, FolderPlus, FolderInput, FolderOpen } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SkillManagerSnapshot, WorkspaceSkillProviderKey, WorkspaceTreeNode, CopyWorkspaceSkillInput } from "@shared/contracts";
import { SectionCard } from "../ui/cards";
import { OverviewMetric } from "../ui/typography";
import { WorkspaceTree } from "../workspace/workspace-tree";

type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;

export function LocalInstallSection({
  t,
  installPathConfigured,
  dropzone,
  remoteUrl,
  onRemoteUrlChange,
  onImportZip,
  onImportFolder,
  onRemoteAction,
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
  searchValue,
  onSearchValueChange
}: {
  t: TranslationDictionary;
  installPathConfigured: boolean;
  dropzone: DropzoneState;
  remoteUrl: string;
  onRemoteUrlChange: (value: string) => void;
  onImportZip: (mode: "staged" | "install") => AsyncActionResult;
  onImportFolder: (mode: "staged" | "install") => AsyncActionResult;
  onRemoteAction: (mode: "staged" | "install") => AsyncActionResult;
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
  const uncategorizedCount = snapshot.installedSkills.filter((skill) => !skill.category).length;
  const categorizedCount = snapshot.installedSkills.length - uncategorizedCount;
  const syncTargetCandidates = [...snapshot.systemSkillSources, ...snapshot.workspaceSkillSources];
  const syncTargetCandidateMap = new Map(syncTargetCandidates.map((candidate) => [candidate.path, candidate]));
  const sortedInstalledSkills = [...filteredInstalledSkills].sort((left, right) => {
    const leftCategory = left.category || "zzz";
    const rightCategory = right.category || "zzz";
    return leftCategory.localeCompare(rightCategory) || left.name.localeCompare(right.name);
  });

  return (
    <div className="space-y-6">
      <SectionCard
        title={t.centerRepositoryTitle || "中心仓库总览"}
        subtitle={t.centerRepositorySubtitle || "这里是系统正式纳管的技能主版本库，分类、推荐和后续同步都会以这里为准。"}
        actions={
          <button
            className="app-button"
            onClick={() => void onSyncAllSkills()}
            type="button"
          >
            {t.syncAllSkillsAction || "同步全部"}
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-4">
          <OverviewMetric label={t.sectionSkills || "已纳管技能"} value={snapshot.installedSkills.length} />
          <OverviewMetric label={t.installedMetricCategories || "分类数"} value={availableCategories.length} />
          <OverviewMetric label={t.categorizedSkillsLabel || "已分类"} value={categorizedCount} />
          <OverviewMetric label={t.uncategorizedSkillsLabel || "未分类"} value={uncategorizedCount} />
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title={t.localZipImport} subtitle={t.localZipImportSubtitle}>
          <div
            {...dropzone.getRootProps()}
            className={cn(
              "rounded-[28px] border border-dashed p-8 text-center transition",
              dropzone.isDragActive
                ? "border-signal bg-signal/10"
                : "border-black/15 dark:border-white/15 bg-transparent hover:border-black/30 dark:hover:border-white/30 hover:bg-black/5 dark:hover:bg-white/5"
            )}
          >
            <input {...dropzone.getInputProps()} />
            <UploadCloud className="mx-auto h-10 w-10 text-signal" />
            <p className="mt-4 text-lg font-medium app-text">{t.localZipDropTitle}</p>
            <p className="mt-2 text-sm app-text-soft">{t.localZipDropHelp}</p>
            {!installPathConfigured ? (
              <p className="mt-3 text-sm text-amber-700 dark:text-amber-200">{t.installPathRequiredBody}</p>
            ) : null}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                className="app-button"
                onClick={(e) => {
                  e.stopPropagation();
                  void onImportZip("staged");
                }}
                type="button"
              >
                {t.chooseZip}
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t.localFolderImport || "导入本地文件夹"} subtitle={t.localFolderImportSubtitle || "从本地目录批量导入技能"}>
          <div className="app-surface-subtle rounded-3xl p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-signal/10 text-signal">
                <FolderInput className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm app-text">{t.localFolderImportHelp || "选择一个目录并递归识别其中的技能文件夹。"}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    className="app-button"
                    onClick={() => void onImportFolder("staged")}
                    type="button"
                  >
                    {t.chooseFolder || "选择文件夹"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t.addRemoteSource} subtitle={t.addRemoteSourceSubtitle}>
          <div className="app-surface-subtle rounded-3xl p-4">
            <label className="block text-sm font-medium app-text" htmlFor="remote-url">
              {t.remoteSourceLabel}
            </label>
            <div className="mt-3 flex flex-col gap-3">
              <input
                className="app-input h-12 flex-1 rounded-2xl px-4 text-sm outline-none transition focus:border-signal/45"
                id="remote-url"
                onChange={(event) => onRemoteUrlChange(event.target.value)}
                placeholder={t.remoteSourcePlaceholder}
                value={remoteUrl}
                spellCheck={false}
              />
              <button
                className="app-button"
                onClick={() => void onRemoteAction("staged")}
                type="button"
              >
                {t.analyzeNow || t.parseSelected}
              </button>
            </div>
          </div>
        </SectionCard>
      </div>

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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedInstalledSkills.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/15 dark:border-white/15 bg-black/5 dark:bg-black/10 px-4 py-6 text-sm app-text-soft">
              {t.noInstalledSkillsYetDescription || "成功安装后，这里会显示技能。"}
            </div>
          ) : (
            sortedInstalledSkills.map((skill) => (
              <div key={skill.id} className="app-surface-subtle rounded-3xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium app-text" title={skill.name}>{skill.name}</p>
                      <span className="rounded-full border border-black/10 dark:border-white/10 px-2 py-0.5 text-[11px] app-text-soft">
                        {skill.category || t.unclassifiedOption || "未分类"}
                      </span>
                      <span className="rounded-full border border-moss/20 bg-moss/10 px-2 py-0.5 text-[11px] text-moss">
                        {skill.syncStatus}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs app-text-soft">{skill.description || t.noDescriptionAvailable}</p>
                  </div>
                  <button
                    className="app-icon-button shrink-0"
                    onClick={() => void onOpenPath(skill.installPath)}
                    type="button"
                    title={t.openFolder}
                  >
                    <FolderOpen className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 space-y-2">
                  <label className="block text-xs uppercase tracking-[0.16em] app-text-soft">
                    当前分类
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
                    <option value="">未分类</option>
                    {availableCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <p className="truncate text-xs app-text-soft" title={skill.installPath}>
                    {skill.installPath}
                  </p>
                </div>
                <div className="mt-4 rounded-2xl border border-black/10 dark:border-white/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-xs uppercase tracking-[0.16em] app-text-soft">
                      {t.syncTargetsTitle || "同步目标"}
                    </label>
                    <span className="text-xs app-text-soft">
                      {skill.syncTargetCount} {t.syncTargetsCountSuffix || "个"}
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
                          className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 px-3 py-1 text-xs app-text-soft"
                          title={syncTarget.path}
                        >
                          <span>{syncTarget.label}</span>
                          <button
                            className="text-[11px] app-text-soft hover:app-text"
                            onClick={() => void onRemoveSyncTarget({ syncTargetId: syncTarget.id, skillId: skill.id })}
                            type="button"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
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
                      {syncTargetCandidates
                        .filter((candidate) => !skill.syncTargets.some((target) => target.path === candidate.path))
                        .map((candidate) => (
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
