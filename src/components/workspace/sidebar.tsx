import { useState } from "react";
import { ChevronDown, ChevronRight, FolderOpen } from "lucide-react";
import type { WorkspaceSkillProviderKey, WorkspaceTreeNode } from "@shared/contracts";
import { ProviderInstallButtons } from "../ui/buttons";

export function SidebarWorkspaceTree({
  rootLabel,
  rootPath,
  nodes,
  onOpenPath,
  onInstallWorkspaceSkill
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
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/10">
      <button
        className="flex w-full items-center gap-3 px-3 py-3 text-left"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {open ? <ChevronDown className="h-4 w-4 app-text-soft" /> : <ChevronRight className="h-4 w-4 app-text-soft" />}
        <span className="app-sidebar-project-icon">
          <FolderOpen className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium app-text" title={rootLabel}>{rootLabel}</span>
          <span className="mt-1 block truncate text-xs app-text-soft" title={rootPath}>{rootPath}</span>
        </span>
      </button>
      {open ? (
        <div className="border-t border-white/10 px-2 py-2">
          <div className="space-y-1">
            {nodes.map((node) => (
              <SidebarWorkspaceTreeNode key={node.id} node={node} projectRoot={rootPath} onOpenPath={onOpenPath} onInstallWorkspaceSkill={onInstallWorkspaceSkill} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SidebarWorkspaceTreeNode({
  node,
  projectRoot,
  onOpenPath,
  onInstallWorkspaceSkill
}: {
  node: WorkspaceTreeNode;
  projectRoot: string;
  onOpenPath: (path: string) => void;
  onInstallWorkspaceSkill: (
    sourceRoot: string,
    skillRootPath: string,
    providerKey: WorkspaceSkillProviderKey
  ) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const isFolder = node.kind === "folder";

  return (
    <div>
      <div className="group relative flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 overflow-hidden">
        <button
          className="flex min-w-0 flex-1 items-center gap-2 text-left before:absolute before:inset-0"
          onClick={() => {
            if (isFolder) {
              setOpen((current) => !current);
            } else {
              onOpenPath(node.absolutePath);
            }
          }}
          type="button"
        >
          {isFolder ? (
            open ? <ChevronDown className="h-3.5 w-3.5 shrink-0 app-text-soft" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 app-text-soft" />
          ) : (
            <div className="w-3.5 shrink-0" />
          )}
          <span className="truncate text-[13px] app-text" title={node.name}>{node.name}</span>
        </button>

        {node.kind === "skill" && node.skill ? (
          <div className="absolute right-0 top-0 bottom-0 flex items-center gap-1 px-1 bg-slate-100 dark:bg-slate-800 opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-10">
            <ProviderInstallButtons
              onInstall={(providerKey) => {
                void onInstallWorkspaceSkill(projectRoot, node.skill!.rootPath, providerKey);
              }}
            />
          </div>
        ) : null}
      </div>
      {isFolder && open && node.children.length ? (
        <div className="ml-[8px] border-l border-white/10 pl-[4px]">
          {node.children.map((child) => (
            <SidebarWorkspaceTreeNode key={child.id} node={child} projectRoot={projectRoot} onOpenPath={onOpenPath} onInstallWorkspaceSkill={onInstallWorkspaceSkill} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
