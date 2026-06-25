import type { DropzoneState } from "react-dropzone";
import { Search, UploadCloud } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SkillManagerSnapshot, WorkspaceSkillProviderKey, WorkspaceTreeNode } from "@shared/contracts";
import { SectionCard } from "../ui/cards";
import { WorkspaceTree } from "../workspace/workspace-tree";
import { countSkillsInTree } from "@/lib/tree-utils";

type TranslationDictionary = Record<string, string>;
type AsyncActionResult<T = unknown> = void | Promise<T>;

export function LocalInstallSection({
  t,
  installPathConfigured,
  dropzone,
  remoteUrl,
  onRemoteUrlChange,
  onImportZip,
  onRemoteAction,
  snapshot,
  onOpenPath,
  onInstallWorkspaceSkill,
  searchValue,
  onSearchValueChange
}: {
  t: TranslationDictionary;
  installPathConfigured: boolean;
  dropzone: DropzoneState;
  remoteUrl: string;
  onRemoteUrlChange: (value: string) => void;
  onImportZip: (mode: "staged" | "install") => AsyncActionResult;
  onRemoteAction: (mode: "staged" | "install") => AsyncActionResult;
  snapshot: SkillManagerSnapshot;
  onOpenPath: (path: string) => AsyncActionResult;
  onInstallWorkspaceSkill: (
    sourceRoot: string,
    skillRootPath: string,
    providerKey: WorkspaceSkillProviderKey
  ) => AsyncActionResult;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
}) {
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
            emptyMessage={t.projectTreeEmpty || "没有找到可安装的技能"}
          />
        </div>
      </SectionCard>
    </div>
  );
}
