import { useState } from "react";
import { ChevronDown, ChevronRight, Folder, FolderOpen, Sparkles } from "lucide-react";
import type { WorkspaceSkillProviderKey, WorkspaceTreeNode, CopyWorkspaceSkillInput, ImportedProjectRecord } from "@shared/contracts";
import { cn } from "@/lib/cn";
import { SkillInstallMenu } from "./skill-install-menu";
import { LocalFolderSelectionModal } from "./workspace-tree";

const expandedStateStore = new Map<string, boolean>();

export function SidebarWorkspaceTree({
  rootLabel,
  rootPath,
  nodes,
  onOpenPath,
  onInstallWorkspaceSkill,
  onCopyWorkspaceSkill,
  onCreateWorkspaceFolder,
  importedProjects,
  localInstallDir,
  installDirTree,
  defaultOpen = true
}: {
  rootLabel: string;
  rootPath: string;
  nodes: WorkspaceTreeNode[];
  onOpenPath: (path: string) => void;
  onInstallWorkspaceSkill: (
    sourceRoot: string,
    skillRootPath: string,
    providerKey: WorkspaceSkillProviderKey
  ) => Promise<unknown>;
  onCopyWorkspaceSkill?: (input: CopyWorkspaceSkillInput) => Promise<unknown> | void;
  onCreateWorkspaceFolder?: (input: { parentPath: string; folderName: string }) => Promise<unknown> | void;
  importedProjects?: ImportedProjectRecord[];
  localInstallDir?: string;
  installDirTree?: WorkspaceTreeNode[];
  defaultOpen?: boolean;
}) {
  const nodeId = `root-${rootPath}`;
  const [open, setOpen] = useState(() => {
    if (expandedStateStore.has(nodeId)) {
      return expandedStateStore.get(nodeId)!;
    }
    expandedStateStore.set(nodeId, defaultOpen);
    return defaultOpen;
  });

  const [copyTargetNode, setCopyTargetNode] = useState<{ node: WorkspaceTreeNode; rootPath: string } | null>(null);
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const toggleOpen = () => {
    setOpen((current) => {
      const next = !current;
      expandedStateStore.set(nodeId, next);
      return next;
    });
  };

  return (
    <div className="rounded-[14px] border border-white/10 bg-black/10">
      <button
        className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left focus-visible:ring-2 focus-visible:ring-signal/45 focus-visible:outline-none rounded-xl"
        onClick={toggleOpen}
        type="button"
        aria-label={open ? `Collapse ${rootLabel}` : `Expand ${rootLabel}`}
      >
        {open ? <ChevronDown className="h-4 w-4 shrink-0 app-text-soft" /> : <ChevronRight className="h-4 w-4 shrink-0 app-text-soft" />}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] text-app-text-soft bg-black/5 dark:bg-white/5 shadow-[inset_0_0_0_1px_var(--app-border)]">
          <FolderOpen className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium app-text" title={rootLabel}>{rootLabel}</span>
          <span className="mt-0.5 block truncate text-[11px] app-text-soft opacity-75" title={rootPath}>{rootPath}</span>
        </span>
      </button>
      {open ? (
        <div className="border-t border-white/10 px-2 py-2">
          <div className="space-y-1">
            {nodes.map((node) => (
              <SidebarWorkspaceTreeNode 
                key={node.id} 
                node={node} 
                projectRoot={rootPath} 
                onOpenPath={onOpenPath} 
                onInstallWorkspaceSkill={onInstallWorkspaceSkill} 
                onCopyLocal={(skillRootPath) => {
                  setCopyTargetNode({ node, rootPath: skillRootPath });
                  setIsLocalModalOpen(true);
                }}
                onCopyProject={(skillRootPath) => {
                  setCopyTargetNode({ node, rootPath: skillRootPath });
                  setIsProjectModalOpen(true);
                }}
                defaultOpen={defaultOpen} 
              />
            ))}
          </div>
        </div>
      ) : null}

      {isLocalModalOpen && copyTargetNode && (
        <LocalFolderSelectionModal
          nodeName={copyTargetNode.node.name}
          localInstallDir={localInstallDir || ""}
          installDirTree={installDirTree || []}
          onClose={() => setIsLocalModalOpen(false)}
          onCreateWorkspaceFolder={onCreateWorkspaceFolder}
          onConfirm={(targetDirectory) => {
            if (onCopyWorkspaceSkill) {
              void onCopyWorkspaceSkill({
                sourceRoot: rootPath,
                skillRootPath: copyTargetNode.rootPath,
                targetDirectory
              });
            }
            setIsLocalModalOpen(false);
          }}
        />
      )}

      {isProjectModalOpen && copyTargetNode && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h2 className="text-lg font-semibold app-text mb-4">复制到导入的项目</h2>
            <p className="text-sm app-text-soft mb-4">
              请选择要将 <strong>{copyTargetNode.node.name}</strong> 复制到哪个已导入的项目中。
            </p>
            <div className="mb-6 max-h-[40vh] overflow-y-auto space-y-2 pr-2">
              {importedProjects && importedProjects.length > 0 ? (
                importedProjects.map((project) => (
                  <button
                    key={project.id}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                    onClick={() => {
                      if (onCopyWorkspaceSkill) {
                        void onCopyWorkspaceSkill({
                          sourceRoot: rootPath,
                          skillRootPath: copyTargetNode.rootPath,
                          targetDirectory: project.path
                        });
                      }
                      setIsProjectModalOpen(false);
                    }}
                  >
                    <Folder className="h-5 w-5 shrink-0 text-blue-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium app-text truncate">{project.name}</p>
                      <p className="text-[11px] app-text-soft truncate opacity-75">{project.path}</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm app-text-soft py-4 text-center">暂无已导入的项目。</p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                className="app-button px-4"
                onClick={() => setIsProjectModalOpen(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SidebarWorkspaceTreeNode({
  node,
  projectRoot,
  onOpenPath,
  onInstallWorkspaceSkill,
  onCopyLocal,
  onCopyProject,
  defaultOpen = false
}: {
  node: WorkspaceTreeNode;
  projectRoot: string;
  onOpenPath: (path: string) => void;
  onInstallWorkspaceSkill: (
    sourceRoot: string,
    skillRootPath: string,
    providerKey: WorkspaceSkillProviderKey
  ) => Promise<unknown>;
  onCopyLocal?: (skillRootPath: string) => void;
  onCopyProject?: (skillRootPath: string) => void;
  defaultOpen?: boolean;
}) {
  const nodeId = `node-${projectRoot}-${node.absolutePath}`;
  const [open, setOpen] = useState(() => {
    if (expandedStateStore.has(nodeId)) {
      return expandedStateStore.get(nodeId)!;
    }
    expandedStateStore.set(nodeId, defaultOpen);
    return defaultOpen;
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isFolder = node.kind === "folder";

  const toggleOpen = () => {
    setOpen((current) => {
      const next = !current;
      expandedStateStore.set(nodeId, next);
      return next;
    });
  };

  return (
    <div>
      <div className={cn(
        "group relative flex items-center gap-2 rounded-xl transition-colors",
        isMenuOpen ? "z-50" : "z-0",
        isFolder 
          ? "px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
          : "px-2 py-2 my-0.5 border border-transparent hover:border-black/5 dark:hover:border-white/5 hover:bg-white dark:hover:bg-white/5 hover:shadow-sm"
      )}>
        <button
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 text-left before:absolute before:inset-0 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-signal/45 focus-visible:outline-none rounded-md",
            isFolder ? "" : "pr-[96px]"
          )}
          onClick={() => {
            if (isFolder) {
              toggleOpen();
            } else {
              onOpenPath(node.absolutePath);
            }
          }}
          type="button"
          aria-label={isFolder ? (open ? `Collapse ${node.name}` : `Expand ${node.name}`) : `Open ${node.name}`}
        >
          {isFolder ? (
            <div className="flex items-center gap-1.5">
              {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0 app-text-soft" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 app-text-soft" />}
              <Folder className="h-3.5 w-3.5 shrink-0 text-blue-500/80 dark:text-blue-400/80" />
            </div>
          ) : (
            <div className="flex items-center justify-center h-6 w-6 rounded-md bg-gradient-to-br from-amber-500/20 to-orange-500/10 dark:from-amber-400/25 dark:to-orange-500/15 shrink-0 border border-amber-500/30 dark:border-amber-400/30 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" />
            </div>
          )}
          <span className={cn("truncate app-text min-w-0", isFolder ? "text-[13px]" : "text-[12px] font-medium")} title={node.name}>{node.name}</span>
        </button>

        {node.kind === "skill" && node.skill ? (
          <div className={cn(
            "absolute right-0 top-0 bottom-0 flex items-center gap-1 pr-2 transition-opacity duration-150 z-10",
            isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <SkillInstallMenu
              onInstall={(providerKey) => {
                void onInstallWorkspaceSkill(projectRoot, node.skill!.rootPath, providerKey);
              }}
              onCopyLocal={() => {
                if (onCopyLocal) onCopyLocal(node.skill!.rootPath);
              }}
              onCopyProject={() => {
                if (onCopyProject) onCopyProject(node.skill!.rootPath);
              }}
              onOpenChange={setIsMenuOpen}
            />
          </div>
        ) : null}
      </div>
      {isFolder && open && node.children.length ? (
        <div className="ml-[8px] border-l border-white/10 pl-[4px]">
          {node.children.map((child) => (
            <SidebarWorkspaceTreeNode 
              key={child.id} 
              node={child} 
              projectRoot={projectRoot} 
              onOpenPath={onOpenPath} 
              onInstallWorkspaceSkill={onInstallWorkspaceSkill} 
              onCopyLocal={onCopyLocal}
              onCopyProject={onCopyProject}
              defaultOpen={defaultOpen} 
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
