import { useState } from "react";
import type { DropzoneState } from "react-dropzone";
import { Search, UploadCloud, FolderPlus, FolderInput } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SkillManagerSnapshot, WorkspaceSkillProviderKey, WorkspaceTreeNode, CopyWorkspaceSkillInput } from "@shared/contracts";
import { SectionCard } from "../ui/cards";
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
  searchValue: string;
  onSearchValueChange: (value: string) => void;
}) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
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

  return (
    <div className="space-y-6">
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
            placeholder={t.search || "搜索..."}
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
        title={t.localInstallDirectory || "本地安装目录 (Local Install Directory)"} 
        subtitle={t.localInstallDirectorySubtitle || "查看和管理您本地统一归档的技能与分类"}
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
