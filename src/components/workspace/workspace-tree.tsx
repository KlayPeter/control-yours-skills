import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, FolderOpen, Folder, Sparkles, FolderPlus } from "lucide-react";
import { cn } from "@/lib/cn";
import type { WorkspaceSkillProviderKey, WorkspaceTreeNode, ImportedProjectRecord, CopyWorkspaceSkillInput } from "@shared/contracts";
import { IconActionButton } from "../ui/buttons";
import { SkillInstallMenu } from "./skill-install-menu";

type AsyncActionResult<T = unknown> = void | Promise<T>;
type WorkspaceTreeActionMode = "none" | "install";

export function WorkspaceTree({
  nodes,
  projectRoot,
  onOpenPath,
  onInstallWorkspaceSkill,
  onCopyWorkspaceSkill,
  importedProjects,
  localInstallDir,
  installDirTree,
  onCreateWorkspaceFolder,
  actionMode = "install",
  showCopyActions = true,
  emptyMessage
}: {
  nodes: WorkspaceTreeNode[];
  projectRoot: string;
  onOpenPath: (path: string) => AsyncActionResult;
  onInstallWorkspaceSkill: (
    sourceRoot: string,
    skillRootPath: string,
    providerKey: WorkspaceSkillProviderKey
  ) => AsyncActionResult;
  onCopyWorkspaceSkill?: (input: CopyWorkspaceSkillInput) => AsyncActionResult;
  onCreateWorkspaceFolder?: (input: { parentPath: string; folderName: string }) => AsyncActionResult;
  importedProjects?: ImportedProjectRecord[];
  localInstallDir?: string;
  installDirTree?: WorkspaceTreeNode[];
  emptyMessage: string;
  actionMode?: WorkspaceTreeActionMode;
  showCopyActions?: boolean;
}) {
  const [copyTargetNode, setCopyTargetNode] = useState<{ node: WorkspaceTreeNode; rootPath: string } | null>(null);
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  if (nodes.length === 0) {
    return <div className="rounded-2xl border border-dashed border-black/15 dark:border-white/15 bg-black/5 dark:bg-black/10 px-4 py-6 text-sm app-text-soft">{emptyMessage}</div>;
  }

  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <WorkspaceTreeNodeRow
          key={node.id}
          node={node}
          actionMode={actionMode}
          onInstallWorkspaceSkill={onInstallWorkspaceSkill}
          onCopyLocal={(skillRootPath) => {
            if (showCopyActions) {
              setCopyTargetNode({ node, rootPath: skillRootPath });
              setIsLocalModalOpen(true);
            }
          }}
          onCopyProject={(skillRootPath) => {
            if (showCopyActions) {
              setCopyTargetNode({ node, rootPath: skillRootPath });
              setIsProjectModalOpen(true);
            }
          }}
          onOpenPath={onOpenPath}
          projectRoot={projectRoot}
          showCopyActions={showCopyActions}
        />
      ))}

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
                sourceRoot: projectRoot,
                skillRootPath: copyTargetNode.rootPath,
                targetDirectory
              });
            }
            setIsLocalModalOpen(false);
          }}
        />
      )}

      {isProjectModalOpen && copyTargetNode && (
        <ProjectSelectionModal
          nodeName={copyTargetNode.node.name}
          importedProjects={importedProjects || []}
          onClose={() => setIsProjectModalOpen(false)}
          onConfirm={(targetDirectory) => {
            if (onCopyWorkspaceSkill) {
              void onCopyWorkspaceSkill({
                sourceRoot: projectRoot,
                skillRootPath: copyTargetNode.rootPath,
                targetDirectory
              });
            }
            setIsProjectModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

export function WorkspaceTreeNodeRow({
  node,
  projectRoot,
  onOpenPath,
  onInstallWorkspaceSkill,
  onCopyLocal,
  onCopyProject,
  actionMode = "install",
  showCopyActions = true
}: {
  node: WorkspaceTreeNode;
  projectRoot: string;
  onOpenPath: (path: string) => AsyncActionResult;
  onInstallWorkspaceSkill: (
    sourceRoot: string,
    skillRootPath: string,
    providerKey: WorkspaceSkillProviderKey
  ) => AsyncActionResult;
  onCopyLocal?: (skillRootPath: string) => void;
  onCopyProject?: (skillRootPath: string) => void;
  actionMode?: WorkspaceTreeActionMode;
  showCopyActions?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isFolder = node.kind === "folder";

  return (
    <div>
      <div className={cn(
        "group relative flex items-center gap-3 transition-all",
        isMenuOpen ? "z-50" : "z-0",
        isFolder 
          ? "py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg px-2 -mx-2"
          : "my-1 p-3 rounded-xl border border-transparent hover:border-black/5 dark:hover:border-white/5 hover:bg-white dark:hover:bg-white/5 hover:shadow-sm"
      )}>
        <button
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 text-left before:absolute before:inset-0 transition-all duration-150",
            isFolder ? "pr-[40px]" : "pr-[140px] cursor-default"
          )}
          onClick={() => {
            if (isFolder) {
              setOpen((current) => !current);
            }
          }}
          type="button"
        >
          {isFolder ? (
            <div className="flex items-center gap-2">
              {open ? <ChevronDown className="h-4 w-4 shrink-0 app-text-soft" /> : <ChevronRight className="h-4 w-4 shrink-0 app-text-soft" />}
              <Folder className="h-4 w-4 shrink-0 text-blue-500/80 dark:text-blue-400/80" />
            </div>
          ) : (
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 dark:from-amber-400/25 dark:to-orange-500/15 shrink-0 border border-amber-500/30 dark:border-amber-400/30 shadow-sm">
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-300" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className={cn("truncate text-[13px] app-text", isFolder ? "font-semibold" : "font-medium")} title={node.name}>{node.name}</p>
            {node.description ? <p className="mt-1 line-clamp-2 text-[11px] app-text-soft" title={node.description}>{node.description}</p> : null}
          </div>
        </button>
        <div className={cn(
          "absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-2 transition-opacity duration-150 z-10",
          isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          <IconActionButton icon={FolderOpen} label="打开目录" onClick={() => void onOpenPath(node.absolutePath)} />
          {actionMode === "install" && node.kind === "skill" && node.skill ? (
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
              showCopyActions={showCopyActions}
            />
          ) : null}
        </div>
      </div>
      {isFolder && open && node.children.length ? (
        <div className="ml-[8px] border-l border-black/10 dark:border-white/10 pl-[4px]">
          <div className="space-y-1">
            {node.children.map((child) => (
              <WorkspaceTreeNodeRow
                key={child.id}
                node={child}
                actionMode={actionMode}
                onInstallWorkspaceSkill={onInstallWorkspaceSkill}
                onCopyLocal={onCopyLocal}
                onCopyProject={onCopyProject}
                onOpenPath={onOpenPath}
                projectRoot={projectRoot}
                showCopyActions={showCopyActions}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProjectSelectionModal({
  nodeName,
  importedProjects,
  onClose,
  onConfirm
}: {
  nodeName: string;
  importedProjects: ImportedProjectRecord[];
  onClose: () => void;
  onConfirm: (targetDirectory: string) => void;
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h2 className="text-lg font-semibold app-text mb-4">选择目标项目</h2>
        <p className="text-sm app-text-soft mb-4">
          即将把技能 <strong>{nodeName}</strong> 复制到以下选中的项目中：
        </p>

        <div className="max-h-[50vh] overflow-y-auto mb-6 border border-black/10 dark:border-white/10 rounded-lg">
          {importedProjects.length === 0 ? (
            <div className="p-4 text-center text-sm app-text-soft">暂无导入的项目</div>
          ) : (
            <div className="flex flex-col">
              {importedProjects.map((project) => {
                const getFolders = (nodes: WorkspaceTreeNode[]): WorkspaceTreeNode[] => {
                  let res: WorkspaceTreeNode[] = [];
                  for (const n of nodes) {
                    if (n.kind === 'folder') {
                      res.push(n);
                      res = res.concat(getFolders(n.children));
                    }
                  }
                  return res;
                };
                const folders = getFolders(project.tree);

                return (
                  <div key={project.id} className="border-b border-black/5 dark:border-white/5 last:border-0 flex flex-col">
                    <button
                      className={cn(
                        "flex items-center gap-2 px-4 py-3 text-left transition-colors",
                        selectedProjectId === project.id && !selectedFolderId
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : "hover:bg-black/5 dark:hover:bg-white/5"
                      )}
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setSelectedFolderId(null);
                      }}
                    >
                      <Folder className={cn("h-4 w-4 shrink-0", selectedProjectId === project.id && !selectedFolderId ? "text-blue-500" : "app-text-soft")} />
                      <div className="flex flex-col">
                        <span className={cn("text-sm font-medium", selectedProjectId === project.id && !selectedFolderId ? "text-blue-600 dark:text-blue-400" : "app-text")}>{project.name} (根目录)</span>
                        <span className="text-xs app-text-soft truncate w-full mt-0.5" title={project.path}>{project.path}</span>
                      </div>
                    </button>
                    
                    {folders.map(folder => (
                      <button
                        key={folder.id}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 pl-10 text-left transition-colors border-t border-black/5 dark:border-white/5",
                          selectedProjectId === project.id && selectedFolderId === folder.id
                            ? "bg-blue-50/50 dark:bg-blue-900/10"
                            : "hover:bg-black/5 dark:hover:bg-white/5"
                        )}
                        onClick={() => {
                          setSelectedProjectId(project.id);
                          setSelectedFolderId(folder.id);
                        }}
                      >
                        <Folder className={cn("h-3.5 w-3.5 shrink-0", selectedProjectId === project.id && selectedFolderId === folder.id ? "text-blue-500" : "app-text-soft/70")} />
                        <span className={cn("text-[13px]", selectedProjectId === project.id && selectedFolderId === folder.id ? "text-blue-600 dark:text-blue-400 font-medium" : "app-text")}>
                          {folder.absolutePath.substring(project.path.length).replace(/^[/\\]+/, '')}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button className="app-button px-4" onClick={onClose}>
            取消
          </button>
          <button
            className="app-button-primary px-4"
            disabled={!selectedProjectId}
            onClick={() => {
              const project = importedProjects.find(p => p.id === selectedProjectId);
              if (project) {
                if (selectedFolderId) {
                  const getFolders = (nodes: WorkspaceTreeNode[]): WorkspaceTreeNode[] => {
                    let res: WorkspaceTreeNode[] = [];
                    for (const n of nodes) {
                      if (n.kind === 'folder') {
                        res.push(n);
                        res = res.concat(getFolders(n.children));
                      }
                    }
                    return res;
                  };
                  const folders = getFolders(project.tree);
                  const selectedFolder = folders.find(f => f.id === selectedFolderId);
                  if (selectedFolder) {
                    onConfirm(selectedFolder.absolutePath);
                    return;
                  }
                }
                onConfirm(project.path);
              }
            }}
          >
            确认复制
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function LocalFolderSelectionModal({
  nodeName,
  localInstallDir,
  installDirTree,
  onClose,
  onConfirm,
  onCreateWorkspaceFolder
}: {
  nodeName: string;
  localInstallDir: string;
  installDirTree: WorkspaceTreeNode[];
  onClose: () => void;
  onConfirm: (targetDirectory: string) => void;
  onCreateWorkspaceFolder?: (input: { parentPath: string; folderName: string }) => AsyncActionResult;
}) {
  const [selectedFolderId, setSelectedFolderId] = useState<string>("root");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const folderNodes = installDirTree.filter(n => n.kind === "folder");

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !onCreateWorkspaceFolder) return;
    let parentPath = localInstallDir;
    if (selectedFolderId !== "root") {
      const selectedNode = folderNodes.find(n => n.id === selectedFolderId);
      if (selectedNode) parentPath = selectedNode.absolutePath;
    }

    try {
      await onCreateWorkspaceFolder({ parentPath, folderName: newFolderName.trim() });
      setNewFolderName("");
      setIsCreatingFolder(false);
    } catch (e) {
      console.error(e);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h2 className="text-lg font-semibold app-text mb-4">复制到本地分类</h2>
        <p className="text-sm app-text-soft mb-4">
          请选择要将技能 <strong>{nodeName}</strong> 复制到哪个目录：
        </p>

        <div className="max-h-[50vh] overflow-y-auto mb-6 border border-black/10 dark:border-white/10 rounded-lg">
          <div className="flex flex-col">
            <button
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-left transition-colors border-b border-black/5 dark:border-white/5",
                selectedFolderId === "root"
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : "hover:bg-black/5 dark:hover:bg-white/5"
              )}
              onClick={() => setSelectedFolderId("root")}
            >
              <Folder className={cn("h-4 w-4 shrink-0", selectedFolderId === "root" ? "text-blue-500" : "app-text-soft")} />
              <div className="flex flex-col">
                <span className={cn("text-sm font-medium", selectedFolderId === "root" ? "text-blue-600 dark:text-blue-400" : "app-text")}>根目录 (默认)</span>
                <span className="text-xs app-text-soft truncate w-full mt-0.5" title={localInstallDir}>{localInstallDir}</span>
              </div>
            </button>
            {folderNodes.map((folder) => (
              <button
                key={folder.id}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 pl-8 text-left transition-colors border-b border-black/5 dark:border-white/5 last:border-0",
                  selectedFolderId === folder.id
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "hover:bg-black/5 dark:hover:bg-white/5"
                )}
                onClick={() => setSelectedFolderId(folder.id)}
              >
                <Folder className={cn("h-4 w-4 shrink-0", selectedFolderId === folder.id ? "text-blue-500" : "app-text-soft")} />
                <span className={cn("text-sm font-medium", selectedFolderId === folder.id ? "text-blue-600 dark:text-blue-400" : "app-text")}>{folder.name}</span>
              </button>
            ))}
          </div>
        </div>

        {isCreatingFolder ? (
          <div className="mb-6 flex items-center gap-2 p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-black/10 dark:border-white/10">
            <input
              type="text"
              autoFocus
              className="flex-1 bg-transparent text-sm app-text focus:outline-none"
              placeholder="输入新文件夹名称..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreateFolder();
                if (e.key === 'Escape') {
                  setIsCreatingFolder(false);
                  setNewFolderName("");
                }
              }}
            />
            <button className="text-xs font-medium text-blue-500 hover:text-blue-600" onClick={() => void handleCreateFolder()}>创建</button>
            <button className="text-xs font-medium app-text-soft hover:app-text" onClick={() => { setIsCreatingFolder(false); setNewFolderName(""); }}>取消</button>
          </div>
        ) : (
          <div className="mb-6 flex justify-start">
            <button 
              className="flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              onClick={() => setIsCreatingFolder(true)}
            >
              <FolderPlus className="h-4 w-4" />
              新建分类文件夹
            </button>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button className="app-button px-4" onClick={onClose}>
            取消
          </button>
          <button
            className="app-button-primary px-4"
            disabled={!localInstallDir}
            onClick={() => {
              if (selectedFolderId === "root") {
                onConfirm(localInstallDir);
              } else {
                const selectedNode = folderNodes.find(n => n.id === selectedFolderId);
                if (selectedNode) {
                  onConfirm(selectedNode.absolutePath);
                }
              }
            }}
          >
            确认复制
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
