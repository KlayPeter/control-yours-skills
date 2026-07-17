import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, FolderPlus, FolderOpen, ArrowRight, Settings, X, ChevronDown, Check, Tags } from "lucide-react";
import * as Select from "@radix-ui/react-select";
import { ProviderIcon } from "../ui/icons";
import type { SkillManagerSnapshot, WorkspaceSkillProviderKey, WorkspaceTreeNode, ImportedProjectRecord, WorkspaceSkillSource } from "@shared/contracts";
import { SectionCard } from "../ui/cards";
import { SyncStatusBadge } from "../ui/badges";
import { WorkspaceTree } from "../workspace/workspace-tree";
import { SkillLifecycleDialog } from "../workspace/skill-lifecycle-dialog";
import { getSkillManagerApi } from "@/lib/electron-api";

type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;
type InstalledSkillCard = SkillManagerSnapshot["installedSkills"][number];

function describeSkillNextStep(skill: InstalledSkillCard, t: TranslationDictionary) {
  if (skill.syncTargetCount === 0) {
    return t.centerRepositoryNextStepBindTarget || "先绑定至少一个同步目标，这个 skill 才能分发出去。";
  }

  if (skill.syncStatus === "outdated") {
    return t.centerRepositoryNextStepSync || "去同步状态页发布，把中心仓库版本推到已绑定目标。";
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

function SkillConfigDialog({
  skill,
  t,
  syncTargetCandidates,
  syncTargetCandidateMap,
  importedProjects,
  onRemoveSyncTarget,
  onAddSyncTarget,
  onGoSyncStatus
}: {
  skill: InstalledSkillCard;
  t: TranslationDictionary;
  syncTargetCandidates: WorkspaceSkillSource[];
  syncTargetCandidateMap: Map<string, WorkspaceSkillSource>;
  importedProjects: ImportedProjectRecord[];
  onRemoveSyncTarget: (input: { syncTargetId: string; skillId?: string }) => AsyncActionResult;
  onAddSyncTarget: (input: { skillId: string; scope: "project" | "system"; providerKey: WorkspaceSkillProviderKey; label: string; path: string }) => AsyncActionResult;
  onGoSyncStatus: () => AsyncActionResult;
}) {
  const [targetScope, setTargetScope] = useState<"system" | "project" | "">("");
  const [targetLabel, setTargetLabel] = useState<string>("");
  const [targetProjectId, setTargetProjectId] = useState<string>("");
  const [targetPath, setTargetPath] = useState<string>("");

  const availableTargets = syncTargetCandidates.filter(
    (candidate) => !skill.syncTargets.some((target) => target.path === candidate.path)
  );

  const candidatesForSystem = availableTargets.filter(c => c.scope === "system");
  const availableSystemLabels = Array.from(new Set(candidatesForSystem.map(c => c.label)));
  const systemCandidatesForLabel = candidatesForSystem.filter(c => c.label === targetLabel);

  const candidatesForProject = availableTargets.filter(c => c.scope === "project");
  
  const availableProjects = importedProjects.filter(p => 
    p.sources.some(s => candidatesForProject.some(c => c.id === s.id))
  );

  const selectedProject = importedProjects.find(p => p.id === targetProjectId);
  const availableProjectSources = selectedProject 
    ? selectedProject.sources.filter(s => candidatesForProject.some(c => c.id === s.id))
    : [];

  const handleAdd = () => {
    let finalPath = targetPath;
    
    if (!finalPath) {
      if (targetScope === "system" && systemCandidatesForLabel.length === 1) {
        finalPath = systemCandidatesForLabel[0].path;
      } else if (targetScope === "project" && availableProjectSources.length === 1) {
        finalPath = availableProjectSources[0].path;
      }
    }
    
    const candidate = finalPath ? syncTargetCandidateMap.get(finalPath) : undefined;
    if (!candidate) return;

    void onAddSyncTarget({
      skillId: skill.id,
      scope: candidate.scope,
      providerKey: candidate.key,
      label: candidate.label,
      path: candidate.path
    });
    setTargetScope("");
    setTargetLabel("");
    setTargetProjectId("");
    setTargetPath("");
  };

  const isAddDisabled = !targetScope || 
    (targetScope === "system" && (!targetLabel || (systemCandidatesForLabel.length > 1 && !targetPath))) ||
    (targetScope === "project" && (!targetProjectId || (availableProjectSources.length > 1 && !targetPath)));

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="app-button shrink-0 px-2" type="button" onClick={(e) => e.stopPropagation()} title={t.centerRepositoryConfigureAction || "配置"}>
          <Settings className="h-4 w-4" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content 
          className="fixed left-[50%] top-[50%] z-[100] w-full max-w-xl translate-x-[-50%] translate-y-[-50%] p-0 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-[24px]" 
          onClick={(e) => e.stopPropagation()}
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement;
            // Native selects or external interactions can trigger interactOutside in Radix.
            // We only want to close the modal if the user explicitly clicked the Overlay background.
            // The overlay has 'fixed' and 'inset-0' classes.
            if (!target?.classList?.contains('fixed') || !target?.classList?.contains('inset-0')) {
              e.preventDefault();
            }
          }}
        >
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white dark:bg-[#1a1a1a] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5">
              <Dialog.Title className="text-lg font-semibold app-text">
                {t.configureSkillTitle || "配置技能"} - {skill.name}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="rounded-full p-1.5 app-text-soft hover:bg-black/5 dark:hover:bg-white/5 hover:app-text transition-colors outline-none">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs uppercase tracking-[0.16em] app-text-soft">
                    {t.centerRepositoryLocationTitle || "仓库位置"}
                  </p>
                  <p className="mt-2 text-sm break-all app-text" title={skill.installPath}>
                    {formatPathPreview(skill.installPath)}
                  </p>
                </div>
                <div className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs uppercase tracking-[0.16em] app-text-soft">
                    {t.centerRepositoryNextStepTitle || "建议下一步"}
                  </p>
                  <p className="mt-2 text-sm leading-6 app-text">{describeSkillNextStep(skill, t)}</p>
                </div>
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
                <div className="mt-4 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      className="app-input h-10 flex-1 rounded-2xl px-3 text-sm"
                      value={targetScope}
                      onChange={(e) => {
                        setTargetScope(e.target.value as "system" | "project" | "");
                        setTargetLabel("");
                        setTargetProjectId("");
                        setTargetPath("");
                      }}
                    >
                      <option value="">{t.selectTargetScope || "选择目标范围"}</option>
                      <option value="system">{t.syncTargetScopeSystem || "系统目标"}</option>
                      <option value="project">{t.syncTargetScopeProject || "项目目标"}</option>
                    </select>
                    
                    {targetScope !== "project" ? (
                      <Select.Root
                        value={targetLabel}
                        disabled={!targetScope || availableSystemLabels.length === 0}
                        onValueChange={(val) => {
                          setTargetLabel(val);
                          setTargetPath("");
                        }}
                      >
                        <Select.Trigger className="app-input flex h-10 flex-1 items-center justify-between rounded-2xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-signal/45 disabled:opacity-50">
                          <Select.Value placeholder={
                            !targetScope 
                              ? (t.selectPlatform || "请先选择目标范围") 
                              : availableSystemLabels.length === 0 
                                ? "暂无可用系统" 
                                : "选择系统平台"
                          } />
                          <Select.Icon>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className="z-[200] max-h-96 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-black/10 bg-white shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 dark:border-white/10 dark:bg-[#1a1a1a]">
                            <Select.Viewport className="p-1">
                              {availableSystemLabels.map((lbl) => {
                                const providerKey = lbl.toLowerCase() as WorkspaceSkillProviderKey;
                                return (
                                  <Select.Item
                                    key={lbl}
                                    value={lbl}
                                    className="relative flex w-full cursor-default select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm outline-none focus:bg-black/5 dark:focus:bg-white/5 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                  >
                                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                      <Select.ItemIndicator>
                                        <Check className="h-4 w-4" />
                                      </Select.ItemIndicator>
                                    </span>
                                    <Select.ItemText>
                                      <div className="flex items-center gap-2">
                                        <ProviderIcon providerKey={providerKey} className="h-4 w-4 shrink-0 text-black/60 dark:text-white/60" />
                                        <span>.{providerKey}</span>
                                      </div>
                                    </Select.ItemText>
                                  </Select.Item>
                                );
                              })}
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    ) : (
                      <select
                        className="app-input h-10 flex-1 rounded-2xl px-3 text-sm"
                        value={targetProjectId}
                        disabled={availableProjects.length === 0}
                        onChange={(e) => {
                          setTargetProjectId(e.target.value);
                          setTargetPath("");
                        }}
                      >
                        <option value="">
                          {availableProjects.length === 0 ? "暂无可同步项目" : "选择项目"}
                        </option>
                        {availableProjects.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {targetScope === "system" && targetLabel && systemCandidatesForLabel.length > 1 && (
                    <select
                      className="app-input h-10 w-full rounded-2xl px-3 text-sm"
                      value={targetPath}
                      onChange={(e) => setTargetPath(e.target.value)}
                    >
                      <option value="">{t.selectSystemDirectory || "选择具体系统目录"}</option>
                      {systemCandidatesForLabel.map(c => (
                        <option key={c.id || c.path} value={c.path}>
                          {c.path}
                        </option>
                      ))}
                    </select>
                  )}

                  {targetScope === "project" && targetProjectId && availableProjectSources.length > 0 && (
                    <Select.Root
                      value={targetPath}
                      onValueChange={setTargetPath}
                    >
                      <Select.Trigger className="app-input flex h-10 w-full items-center justify-between rounded-2xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-signal/45 disabled:opacity-50">
                        <Select.Value placeholder="选择具体的项目平台目录" />
                        <Select.Icon>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="z-[200] max-h-96 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-black/10 bg-white shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 dark:border-white/10 dark:bg-[#1a1a1a]">
                          <Select.Viewport className="p-1">
                            {availableProjectSources.map((source) => {
                              return (
                                <Select.Item
                                  key={source.id || source.path}
                                  value={source.path}
                                  className="relative flex w-full cursor-default select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm outline-none focus:bg-black/5 dark:focus:bg-white/5 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                >
                                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                    <Select.ItemIndicator>
                                      <Check className="h-4 w-4" />
                                    </Select.ItemIndicator>
                                  </span>
                                  <Select.ItemText>
                                    <div className="flex items-center gap-2">
                                      <ProviderIcon providerKey={source.key} className="h-4 w-4 shrink-0 text-black/60 dark:text-white/60" />
                                      <span className="truncate">.{source.key} ({formatPathPreview(source.path)})</span>
                                    </div>
                                  </Select.ItemText>
                                </Select.Item>
                              );
                            })}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  )}
                  
                  <button
                    className="app-button w-full justify-center"
                    disabled={isAddDisabled}
                    onClick={handleAdd}
                    type="button"
                  >
                    {t.addSyncTargetAction || "添加目标"}
                  </button>

                  <button
                    className="app-button w-full justify-center"
                    disabled={skill.syncTargetCount === 0}
                    onClick={() => void onGoSyncStatus()}
                    type="button"
                  >
                    {t.centerRepositoryGoSyncAction || "查看发布与同步"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function LocalInstallSection({
  t,
  snapshot,
  onOpenPath,
  onCreateWorkspaceFolder,
  onAddSyncTarget,
  onRemoveSyncTarget,
  onGoStaged,
  onGoSyncStatus,
  onRefresh,
  searchValue,
  onSearchValueChange
}: {
  t: TranslationDictionary;
  snapshot: SkillManagerSnapshot;
  onOpenPath: (path: string) => AsyncActionResult;
  onCreateWorkspaceFolder?: (input: { parentPath: string; folderName: string }) => AsyncActionResult;
  onAddSyncTarget: (input: { skillId: string; scope: "project" | "system"; providerKey: WorkspaceSkillProviderKey; label: string; path: string }) => AsyncActionResult;
  onRemoveSyncTarget: (input: { syncTargetId: string; skillId?: string }) => AsyncActionResult;
  onGoStaged: () => AsyncActionResult;
  onGoSyncStatus: () => AsyncActionResult;
  onRefresh: () => AsyncActionResult;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
}) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(new Set());
  const [tagFilter, setTagFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [batchTag, setBatchTag] = useState("");
  const [batchCategory, setBatchCategory] = useState("__unchanged__");
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchNotice, setBatchNotice] = useState<string | null>(null);
  const installTree = snapshot.installDirTree;
  const installedSkillByPath = new Map(snapshot.installedSkills.map((skill) => [skill.installPath, skill]));
  const allTags = [...new Set(snapshot.installedSkills.flatMap((skill) => skill.tags))].sort();

  const filterTree = (nodes: WorkspaceTreeNode[], search: string): WorkspaceTreeNode[] => {
    const lowerSearch = search.trim().toLowerCase();
    
    return nodes.map(node => {
      if (node.kind === 'skill') {
        const skill = installedSkillByPath.get(node.absolutePath);
        const matchesSearch = !lowerSearch || [
          node.name,
          skill?.name,
          skill?.slug,
          skill?.description,
          ...(skill?.tags || [])
        ].some((value) => value?.toLowerCase().includes(lowerSearch));
        const matchesTag = !tagFilter || skill?.tags.includes(tagFilter);
        const matchesCategory = !categoryFilter || skill?.category === categoryFilter;
        return matchesSearch && matchesTag && matchesCategory ? node : null;
      }
      if (node.kind === 'folder') {
        const filteredChildren = filterTree(node.children, search);
        if (filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
      }
      return null;
    }).filter((n): n is WorkspaceTreeNode => n !== null);
  };

  const filteredTree = filterTree(installTree, searchValue);
  const syncTargetCandidates = [...snapshot.systemSkillSources, ...snapshot.workspaceSkillSources];
  const syncTargetCandidateMap = new Map(syncTargetCandidates.map((candidate) => [candidate.path, candidate]));
  const visiblePaths = new Set<string>();
  const collectVisiblePaths = (nodes: WorkspaceTreeNode[]) => {
    for (const node of nodes) {
      if (node.kind === "skill") visiblePaths.add(node.absolutePath);
      else collectVisiblePaths(node.children);
    }
  };
  collectVisiblePaths(filteredTree);
  const visibleSkillIds = snapshot.installedSkills
    .filter((skill) => visiblePaths.has(skill.installPath))
    .map((skill) => skill.id);

  const toggleSkillSelection = (skillId: string) => {
    setSelectedSkillIds((current) => {
      const next = new Set(current);
      if (next.has(skillId)) next.delete(skillId);
      else next.add(skillId);
      return next;
    });
  };

  const runBatchUpdate = async (action: "category" | "add-tag" | "remove-tag") => {
    if (selectedSkillIds.size === 0 || (action !== "category" && !batchTag.trim())) return;
    setBatchBusy(true);
    setBatchError(null);
    setBatchNotice(null);
    try {
      const result = await getSkillManagerApi().batchUpdateInstalledSkills({
        ids: [...selectedSkillIds],
        ...(action === "category"
          ? { category: batchCategory === "__uncategorized__" ? null : batchCategory }
          : {}),
        ...(action === "add-tag" ? { addTags: [batchTag] } : {}),
        ...(action === "remove-tag" ? { removeTags: [batchTag] } : {})
      });
      if (!result.ok || !result.data) {
        throw new Error(result.error || "批量更新失败。");
      }
      setBatchTag("");
      setBatchNotice(`已更新 ${result.data.length} 个技能。`);
      await Promise.resolve()
        .then(() => onRefresh())
        .catch(() => setBatchError("更新已成功，但列表刷新失败；请点击右上角刷新。"));
    } catch (updateError) {
      setBatchError(updateError instanceof Error ? updateError.message : "批量更新失败。");
    } finally {
      setBatchBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm app-text-soft">这里是所有你选择纳管的 Skill 的本地存储库</p>
        <div className="flex flex-wrap gap-2">
          <button className="app-button whitespace-nowrap" onClick={() => void onGoStaged()} type="button">
            <ArrowRight className="h-4 w-4" />
            {t.centerRepositoryAddSourceAction || "前往添加来源"}
          </button>
          <button className="app-button whitespace-nowrap" onClick={() => void onGoSyncStatus()} type="button">
            <ArrowRight className="h-4 w-4" />
            {t.centerRepositoryGoSyncAction || "查看发布与同步"}
          </button>
        </div>
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

      <div className="app-surface-subtle rounded-3xl p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-[0.16em] app-text-soft" htmlFor="asset-category-filter">分类筛选</label>
              <select className="app-input mt-2 h-10 w-full rounded-2xl px-3 text-sm" id="asset-category-filter" onChange={(event) => setCategoryFilter(event.target.value)} value={categoryFilter}>
                <option value="">全部分类</option>
                {snapshot.installCategories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.16em] app-text-soft" htmlFor="asset-tag-filter">标签筛选</label>
              <select className="app-input mt-2 h-10 w-full rounded-2xl px-3 text-sm" id="asset-tag-filter" onChange={(event) => setTagFilter(event.target.value)} value={tagFilter}>
                <option value="">全部标签</option>
                {allTags.map((tag) => <option key={tag} value={tag}>#{tag}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm app-text-soft">已选 {selectedSkillIds.size} 个</span>
            <button className="app-button px-3" disabled={visibleSkillIds.length === 0} onClick={() => setSelectedSkillIds(new Set(visibleSkillIds))} type="button">全选筛选结果</button>
            <button className="app-button px-3" disabled={selectedSkillIds.size === 0} onClick={() => setSelectedSkillIds(new Set())} type="button">清空选择</button>
          </div>
        </div>

        {selectedSkillIds.size > 0 ? (
          <div className="mt-4 border-t border-black/10 pt-4 dark:border-white/10">
            <div className="grid gap-3 xl:grid-cols-[minmax(180px,0.8fr),auto,minmax(180px,1fr),auto,auto]">
              <select aria-label="批量分类" className="app-input h-10 rounded-2xl px-3 text-sm" onChange={(event) => setBatchCategory(event.target.value)} value={batchCategory}>
                <option value="__unchanged__">选择批量分类</option>
                <option value="__uncategorized__">取消分类</option>
                {snapshot.installCategories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
              </select>
              <button className="app-button px-4" disabled={batchBusy || batchCategory === "__unchanged__"} onClick={() => void runBatchUpdate("category")} type="button">应用分类</button>
              <div className="relative">
                <Tags className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 app-text-soft" />
                <input aria-label="批量标签" className="app-input h-10 w-full rounded-2xl pl-9 pr-3 text-sm" maxLength={40} onChange={(event) => setBatchTag(event.target.value)} placeholder="输入标签，例如 stable" value={batchTag} />
              </div>
              <button className="app-button px-4" disabled={batchBusy || !batchTag.trim()} onClick={() => void runBatchUpdate("add-tag")} type="button">添加标签</button>
              <button className="app-button px-4" disabled={batchBusy || !batchTag.trim()} onClick={() => void runBatchUpdate("remove-tag")} type="button">移除标签</button>
            </div>
            {batchError ? <p className="mt-3 text-sm text-red-600 dark:text-red-300">{batchError}</p> : null}
            {batchNotice ? <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-300">{batchNotice}</p> : null}
          </div>
        ) : null}
      </div>

      <SectionCard 
        title={t.localInstallDirectory || "中心仓库目录"} 
        subtitle={t.localInstallDirectorySubtitle || "查看和管理中心仓库在磁盘上的真实目录结构"}
      >
        <div className="mb-4 mt-2 p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-[11px] uppercase font-bold text-zinc-500 shrink-0 tracking-wider">物理路径</span>
            <code className="text-[13px] font-mono truncate text-zinc-800 dark:text-zinc-200 select-all">{snapshot.settings.installDir || "未设置"}</code>
          </div>
          <button 
            onClick={() => void onOpenPath(snapshot.settings.installDir || "")} 
            className="app-icon-button shrink-0 h-8 w-8 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors" 
            title="在文件夹中打开"
          >
            <FolderOpen className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>
        <div className="mt-4">
          <WorkspaceTree
            nodes={filteredTree}
            projectRoot={snapshot.settings.installDir || ""}
            onOpenPath={onOpenPath}
            actionMode="none"
            importedProjects={snapshot.importedProjects}
            emptyMessage={t.projectTreeEmpty || "没有找到可安装的技能"}
          renderNodeRight={(node) => {
            if (node.kind !== 'skill') return null;
            const skill = snapshot.installedSkills.find(s => s.installPath === node.absolutePath);
            if (!skill) {
              return (
                 <div className="flex items-center gap-3 mr-2">
                   <div className="hidden sm:block">
                     <span className="inline-flex items-center gap-1 rounded-full border border-black/10 dark:border-white/10 px-2 py-0.5 text-[10px] app-text-soft bg-black/5 dark:bg-white/5">
                        未入库
                     </span>
                   </div>
                   <button 
                     className="app-button shrink-0 px-2" 
                     type="button" 
                     onClick={(e) => {
                       e.stopPropagation();
                       void onGoStaged();
                     }} 
                     title="前往添加来源扫描"
                   >
                     <FolderPlus className="h-4 w-4" />
                   </button>
                 </div>
              );
            }
            return (
               <div className="flex items-center gap-3 mr-2">
                 <input
                   aria-label={`选择 ${skill.name}`}
                   checked={selectedSkillIds.has(skill.id)}
                   className="h-4 w-4 rounded border-black/20 dark:border-white/20"
                   onChange={() => toggleSkillSelection(skill.id)}
                   onClick={(event) => event.stopPropagation()}
                   type="checkbox"
                 />
                 {skill.tags.slice(0, 2).map((tag) => (
                   <span className="hidden rounded-full border border-black/10 px-2 py-0.5 text-[10px] app-text-soft dark:border-white/10 xl:inline-flex" key={tag}>#{tag}</span>
                 ))}
                 <div className="hidden sm:block">
                   <SyncStatusBadge status={skill.syncStatus} t={t} />
                 </div>
                 <SkillConfigDialog 
                   skill={skill}
                   t={t}
                   syncTargetCandidates={syncTargetCandidates}
                   syncTargetCandidateMap={syncTargetCandidateMap}
                   importedProjects={snapshot.importedProjects}
                   onRemoveSyncTarget={onRemoveSyncTarget}
                   onAddSyncTarget={onAddSyncTarget}
                   onGoSyncStatus={onGoSyncStatus}
                 />
                 <SkillLifecycleDialog skill={skill} onChanged={onRefresh} />
               </div>
            );
          }}
        />
        </div>
      </SectionCard>
    </div>
  );
}
